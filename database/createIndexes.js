// Connect to the expense_tracker database
const database = db.getSiblingDB("expense_tracker");

// Reference the users collection
const users = database.users;

// Prevent duplicate user email addresses
users.createIndex(

    {email: 1},
    {unique: true}
    
)