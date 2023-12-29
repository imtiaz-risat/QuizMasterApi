const http = require('http');
const url = require('url');
const querystring = require('querystring');
const UserController = require('./Controller/userController');
const UserView = require('./View/userView');
const AdminController= require('./Controller/adminController');
const AdminView =require('./View/adminView');

const  QuizView = require('./View/quizView');
const {addQuiz, getAllQuizzes, takeQuiz} = require("./Model/quizModel");

const server = http.createServer((req, res) => {
    const userController = new UserController();
    const userView = new UserView();

    const adminController = new AdminController();
    const adminView = new AdminView();
    const quizView = new QuizView();
    const { pathname } = url.parse(req.url);
    const queryParams = querystring.parse(url.parse(req.url).query);

    

    if (req.method === 'POST' && pathname === '/register') {
        let data = '';
    
        req.on('data', (chunk) => {
            data += chunk;
        });
        req.on('end', () => {
            try {
                const registeredUser = userController.registerUser(data);
    
                userView.sendSuccessResponse(res, 'User registered successfully', registeredUser);
            } catch (error) {
                userView.sendErrorResponse(res, 400, error.message);
            }
        });
    } else if (req.method === 'POST' && pathname === '/login') {
        let data = '';
    
        req.on('data', (chunk) => {
            data += chunk;
        });
    
        req.on('end', () => {
            try {
                const user = userController.loginUser(data);
    
                if (user) {
                    userView.sendSuccessResponse(res, 'Login successful');
                } else {
                    userView.sendErrorResponse(res, 401, 'Authentication failed');
                }
            } catch (error) {
                userView.sendErrorResponse(res, 400, error.message);
            }
        });
    } else if (req.method === 'POST' && pathname === '/admin/register') {
        let data = '';
    
        req.on('data', (chunk) => {
            data += chunk;
        });
    
        req.on('end', () => {
            try {
                const registeredAdmin = adminController.registerAdmin(data);
                adminView.sendSuccessResponse(res, 'Admin registered successfully', registeredAdmin);
            } catch (error) {
                adminView.sendErrorResponse(res, 400, error.message);
            }
        });
    } else if (req.method === 'POST' && pathname === '/admin/login') {
        let data = '';
    
        req.on('data', (chunk) => {
            data += chunk;
        });
    
        req.on('end', () => {
            try {
                const loginResult = adminController.loginAdmin(data);
    
                if (loginResult) {
                    const { admin, accessToken } = loginResult;
                    delete admin.password;
                    adminView.sendLogInSuccessResponse(res, 'Login successful', { admin, access_token: accessToken });
                } else {
                    adminView.sendErrorResponse(res, 401, 'Authentication failed');
                }
            } catch (error) {
                adminView.sendErrorResponse(res, 400, error.message);
            }
        });
    } else if (req.method === 'POST' && pathname === '/admin/addQuiz') {
        authenticateAdmin(req, res, () => {
            let data = '';
            req.on('data', (chunk) => {
                data += chunk;
            });
    
            req.on('end', () => {
                const { question, options, correctAnswer, questionID } = JSON.parse(data);
                const token = req.headers.authorization;
    
                try {
                    const addedQuiz = addQuiz(question, options, correctAnswer, questionID);
                    const quizResponse = {
                        question: addedQuiz.question,
                        options: addedQuiz.options,
                        questionID: addedQuiz.questionID,
                    };
                    quizView.sendSuccessResponse(res, 'Quiz added successfully', quizResponse);
                } catch (error) {
                    console.error(error);
                    quizView.sendErrorResponse(res, 400, 'Invalid data');
                }
    
    
             })
    
        });
    }else if(req.method==="GET" && req.url==="/user/takeQuiz"){

        try{
           const data= getAllQuizzes();


           quizView.sendSuccessResponse(res,"fetched successfully",data);

        }catch (error){
            quizView.sendErrorResponse(res,401,"No quiz is stored");
        }

    }else if(req.method === "POST" && req.url==="/user/submitQuiz"){
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {


            let userResponses;
            try {
                userResponses = JSON.parse(body);
                const result = takeQuiz(userResponses);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(result));
            } catch (error) {
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: 'Invalid JSON in request body'}));

            }
        });
    }
    else {

        userView.sendErrorResponse(res, 404, 'Not Found');
    }


    // Middleware for Admin-Only Routes
    function authenticateAdmin(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        adminView.sendErrorResponse(res, 401, 'Unauthorized: Access token missing.');
        return;
    }

    const admin = adminController.findAdminByAccessToken(token);

    if (!admin) {
        adminView.sendErrorResponse(res, 401, 'Unauthorized: Invalid access token.');
        return;
    }

    // Attach the admin object to the request for use in subsequent route handlers
    req.admin = admin;
    next();
};
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});







