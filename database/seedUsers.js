// Connect to the expense_tracker database
const database = db.getSiblingDB("expense_tracker");

// Reference the users collection
const users = database.users;

// Insert sample users for database testing
users.insertMany([

  { name: "John Doe", email: "j.doe@example.com", password_hash: "fake_user1", 
    created_at: new Date()  },
  { name: "Jane Smith", email: "j.smith@example.com", password_hash: "fake_user2", 
    created_at: new Date()  }
    
]);