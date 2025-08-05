"""
Production Database Configuration for ClamFlow Cloud Deployment
============================================================

This module provides production-ready database configuration for Vercel deployment.
Supports both development (SQLite) and production (PostgreSQL) environments.
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from fastapi import FastAPI
from typing import Generator

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Production: PostgreSQL via Supabase
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False  # Set to True for SQL logging in development
    )
else:
    # Development: SQLite fallback
    SQLALCHEMY_DATABASE_URL = "sqlite:///./clamflow.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )

# Session Configuration
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Dependency for FastAPI
def get_db() -> Generator:
    """
    Database dependency for FastAPI endpoints.
    Provides database session with automatic cleanup.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function to get FastAPI app instance
def get_app() -> FastAPI:
    app = FastAPI(
        title="ClamFlow API - Cloud Production",
        description="Seafood Processing Management System - Enterprise Cloud Deployment",
        version="2.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc"
    )
    return app

# Health Check Function
def check_database_connection() -> bool:
    """
    Check if database connection is healthy.
    Returns True if connection successful, False otherwise.
    """
    try:
        # Use engine connection for raw SQL execution
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False

# Environment Info
def get_database_info() -> dict:
    """
    Get database environment information.
    Useful for debugging and monitoring.
    """
    return {
        "database_type": "PostgreSQL" if DATABASE_URL else "SQLite",
        "database_url": DATABASE_URL[:30] + "..." if DATABASE_URL else "sqlite:///./clamflow.db",
        "environment": os.getenv("VERCEL_ENV", "development"),
        "connection_healthy": check_database_connection()
    }
