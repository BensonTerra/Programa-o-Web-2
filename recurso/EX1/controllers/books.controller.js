const db = require("../models/index.js");
const { ErrorHandler } = require("../utils/error.js");

const Book = db.books;

//necessary for LIKE operator
const { Op, ValidationError } = require('sequelize');
const clear = require('clear');




// Display list of all books (with pagination)
exports.findAll = async (req, res, next) => {
    //get data from request query string (if not existing, they will be undefined)
    let { page, size, title } = req.query;

    // validate page
    if (page && !req.query.page.match(/^(0|[1-9]\d*)$/g))
        return res.status(400).json({ message: 'Page number must be 0 or a positive integer' });
    page = parseInt(page); // if OK, convert it into an integer

    // validate size
    if (size && !req.query.size.match(/^([1-9]\d*)$/g))
        return res.status(400).json({ message: 'Size must be a positive integer' });
    size = parseInt(size); // if OK, convert it into an integer

    // Sequelize function findAndCountAll parameters: 
    //      limit -> number of rows to be retrieved
    //      offset -> number of rows to be offseted (not retrieved)
    const limit = size ? size : 5;          // limit = size (default is 1)
    const offset = page ? page * limit : 0; // offset = page * size (start counting from page 0)

    // search by title require to build a query with the operator L
    const condition = title ? { title: { [Op.like]: `%${title}%` } } : null;


    try {
        let books = await Book.findAndCountAll({
            where: condition,
            limit, offset,
            raw: true
        })

        // map HATEOAS links to each one of the books
        books.rows.forEach(book => {
            //
        });

        // map default response to desired response data structure
        return res.status(200).json({
            success: true,
            data: books.rows,
        });
    }
    catch (err) {
        next(err)
    }
};

// List just one tutorial
exports.findOne = async (req, res, next) => {
    try {
        clear();
        // obtains only a single entry from the table, using the provided primary key
        let book = await Book.findByPk(req.params.id, {
            include: [
                {   // EAGER LOADING
                    model: db.bookGenres,
                    attributes: ['id', 'genre'] // exclude FK tutorialId
                },
                {
                    model: db.genres,
                    through: { attributes: [] } // exclude data from junction table
                }
            ]
        }); //console.log(book)
        // if tutorial was not found
        if (book === null)
            // return next(CreateError(404, `Cannot find any tutorial with ID ${req.params.idT}.`));
            throw new ErrorHandler(404, `Cannot find any book with ID ${req.params.id}.`);

        // answer with a success status if tutorial was found
        return res.json({ 
            success: true, 
            data: book,
            links: [
                { "rel": "delete", "href": `/books/${book.id}`, "method": "DELETE" },
                { "rel": "modify", "href": `/books/${book.id}`, "method": "PUT" },
            ] });
    }
    catch (err) {
        next(err)
    };
};

// Handle tutorial create on POST
exports.create = async (req, res, next) => {
    try {
        // Save Tutorial in the database
        let newBook = await Book.create(req.body);
        res.status(201).json({
            success: true, 
            msg: "Book successfully created.",
        });
    }
    catch (err) {
        // console.log(err.name) // err.name === 'SequelizeValidationError'
        if (err instanceof ValidationError)
            err = new ErrorHandler(400, err.errors.map(e => e.message));
        next(err)
    };
};

// Update a tutorial
exports.update = async (req, res, next) => {
    try {
        // since Sequelize update() does not distinguish if a tutorial exists, first let's try to find one
        let tutorial = await Book.findByPk(req.params.idT);
        if (tutorial === null)
            throw new ErrorHandler(404, `Cannot find any tutorial with ID ${req.params.idT}.`);

        // obtains only a single entry from the table, using the provided primary key
        let affectedRows = await Book.update(req.body, { where: { id: req.params.idT } })

        if (affectedRows[0] === 0) // check if the tutorial was updated (returns [0] if no data was updated)
            return res.status(200).json({
                success: true, msg: `No updates were made on tutorial with ID ${req.params.idT}.`
            });

        return res.json({
            success: true,
            msg: `Tutorial with ID ${req.params.idT} was updated successfully.`
        });
    }
    catch (err) {
        if (err instanceof ValidationError)
            err = new ErrorHandler(400, err.errors.map(e => e.message));
        next(err)
    };
};

// Delete one tutorial
exports.delete = async (req, res, next) => {
    try {
        let result = await Book.destroy({ where: { id: req.params.idT } })
        if (result == 1) // the promise returns the number of deleted rows
            res.status(200).json({
                success: true, msg: `Tutorial with id ${req.params.idT} was successfully deleted!`
            });
        // no rows deleted -> no tutorial was found
        else
            throw new ErrorHandler(404, `Cannot find any tutorial with ID ${req.params.idT}.`);
    }
    catch (err) {
        next(err)
    };
};
