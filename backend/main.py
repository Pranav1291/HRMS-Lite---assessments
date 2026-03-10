import os
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    print("Warning: MONGO_URI is not set in the environment variables.")

client = AsyncIOMotorClient(MONGO_URI) if MONGO_URI else None
db = client.hrms_lite if client else None

# Pydantic models for requests
class EmployeeCreate(BaseModel):
    id: str
    name: str
    email: EmailStr
    department: str

class AttendanceMark(BaseModel):
    employee_id: str
    date: str
    status: str

@app.on_event("startup")
async def startup_db_client():
    if db is not None:
        # Create unique indexes
        await db.employees.create_index("id", unique=True)
        await db.employees.create_index("email", unique=True)
        await db.attendance.create_index([("employee_id", 1), ("date", 1)], unique=True)

@app.get("https://hrms-lite-assessments-6.onrender.com/api/employees")
async def get_employees():
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    employees = await db.employees.find({}, {"_id": 0}).to_list(length=1000)
    return employees

@app.post("https://hrms-lite-assessments-6.onrender.com/api/employees", status_code=201)
async def add_employee(employee: EmployeeCreate):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        await db.employees.insert_one(employee.dict())
        return {"message": "Employee added successfully"}
    except Exception as e:
        error_str = str(e)
        if "duplicate key error" in error_str:
            if "id" in error_str:
                raise HTTPException(status_code=400, detail="Employee ID already exists")
            elif "email" in error_str:
                raise HTTPException(status_code=400, detail="Email already exists")
        raise HTTPException(status_code=500, detail="Failed to add employee")

@app.delete("https://hrms-lite-assessments-6.onrender.com/api/employees/{emp_id}")
async def delete_employee(emp_id: str):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    result = await db.employees.delete_one({"id": emp_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Also delete associated attendance records (cascade delete)
    await db.attendance.delete_many({"employee_id": emp_id})
    return {"message": "Employee deleted successfully"}


@app.get("https://hrms-lite-assessments-6.onrender.com/api/attendance")
async def get_attendance():
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    pipeline = [
        {
            "$lookup": {
                "from": "employees",
                "localField": "employee_id",
                "foreignField": "id",
                "as": "employee_info"
            }
        },
        {"$unwind": "$employee_info"},
        {
            "$project": {
                "_id": 0,
                "id": "$_id",
                "employee_id": 1,
                "date": 1,
                "status": 1,
                "employee_name": "$employee_info.name"
            }
        },
        {"$sort": {"date": -1}}
    ]
    attendance = await db.attendance.aggregate(pipeline).to_list(length=1000)
    # Convert ObjectId to string for id
    for item in attendance:
        if "id" in item:
             item["id"] = str(item["id"])
    return attendance

@app.get("https://hrms-lite-assessments-6.onrender.com/api/attendance/{employee_id}")
async def get_employee_attendance(employee_id: str):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    attendance = await db.attendance.find({"employee_id": employee_id}, {"_id": 0}).sort("date", -1).to_list(length=1000)
    return attendance


@app.post("https://hrms-lite-assessments-6.onrender.com/api/attendance", status_code=201)
async def mark_attendance(attendance: AttendanceMark):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # UPSERT (Insert or Update if exists) based on employee_id and date
    filter_query = {"employee_id": attendance.employee_id, "date": attendance.date}
    update_query = {"$set": {"status": attendance.status}}
    
    try:
        await db.attendance.update_one(filter_query, update_query, upsert=True)
        return {"message": "Attendance marked successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to mark attendance")


@app.get("https://hrms-lite-assessments-6.onrender.com/api/stats")
async def get_stats():
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    total_employees = await db.employees.count_documents({})
    today_str = datetime.now().strftime("%Y-%m-%d")
    present_today = await db.attendance.count_documents({"date": today_str, "status": "Present"})
    
    return {
        "totalEmployees": total_employees,
        "presentToday": present_today
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
