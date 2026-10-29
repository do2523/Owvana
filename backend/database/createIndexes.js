const database = db.getSiblingDB("expense_tracker");
const users = database.users;

users.createIndex(

    {email: 1},
    {unique: true}
    
)