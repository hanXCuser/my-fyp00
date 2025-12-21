"""
Supabase service for database operations
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SupabaseService:
    """Service class for Supabase operations"""
    
    def __init__(self):
        """Initialize Supabase client"""
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        
        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
        
        self.client: Client = create_client(self.url, self.key)
    
    def get_client(self) -> Client:
        """Get the Supabase client instance"""
        return self.client
    
    def insert_data(self, table: str, data: dict):
        """
        Insert data into a specified table
        
        Args:
            table (str): Name of the table
            data (dict): Data to insert
            
        Returns:
            Response from Supabase
        """
        try:
            response = self.client.table(table).insert(data).execute()
            return response
        except Exception as e:
            print(f"Error inserting data: {e}")
            raise
    
    def select_data(self, table: str, filters: dict = None):
        """
        Select data from a specified table
        
        Args:
            table (str): Name of the table
            filters (dict): Optional filters to apply
            
        Returns:
            Response from Supabase
        """
        try:
            query = self.client.table(table).select("*")
            
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            
            response = query.execute()
            return response
        except Exception as e:
            print(f"Error selecting data: {e}")
            raise
    
    def update_data(self, table: str, data: dict, filters: dict):
        """
        Update data in a specified table
        
        Args:
            table (str): Name of the table
            data (dict): Data to update
            filters (dict): Filters to identify records to update
            
        Returns:
            Response from Supabase
        """
        try:
            query = self.client.table(table).update(data)
            
            for key, value in filters.items():
                query = query.eq(key, value)
            
            response = query.execute()
            return response
        except Exception as e:
            print(f"Error updating data: {e}")
            raise
    
    def delete_data(self, table: str, filters: dict):
        """
        Delete data from a specified table
        
        Args:
            table (str): Name of the table
            filters (dict): Filters to identify records to delete
            
        Returns:
            Response from Supabase
        """
        try:
            query = self.client.table(table).delete()
            
            for key, value in filters.items():
                query = query.eq(key, value)
            
            response = query.execute()
            return response
        except Exception as e:
            print(f"Error deleting data: {e}")
            raise


# Create a singleton instance
supabase_service = SupabaseService()
