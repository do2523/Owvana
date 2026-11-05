import Category from '../../backend/database/models/Category.js'

export async function createCatergory(req, res)
{
    try
    {
        const{name} = req.body;

        if(!name)
            {
                res.status(400).json({message: "Missing fields"});
            }
            
        const category = await Category.create({name, group_id: req.group.id});

        if(!category)
            {
                res.status(400).json({message: "Failed to create category"});
            }
        
        res.status(201).json(category);
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"})
    }
}