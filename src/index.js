const { response, request } = require('express')
const express = require('express')
const moment = require('moment')
const {v4: uuidv4} = require("uuid") 
const app = express()
app.use(express.json())
const customers = []

function verifyIfExistsAccountCPF(request,response,next){

    const {cpf} = request.header

    const customer = customers.find(customer => customer.cpf === cpf)
    if(!customer){
        return response.status(400).json({error:'Not found'})
    }
    request.customer = customer
    return next()    
}
function getBalance (statement){
    const balance = statement.reduce((acc, operation) =>{
        if(operation.type === "Credit"){
            return acc + operation.amount
        }else{
            return acc - operation.amount
        }
    },0)
    return balance
}

app.post('/account',(request,response) =>{
    const {cpf, name} = request.body;
    const customersAlready = customers.some(
        (customers) =>  customers.cpf === cpf
        )
if(customersAlready){
    return response.status(400).json({error :"Customer Alread exists!"})
}
    customers.push({
        cpf,
        name,
        id:uuidv4(),
        statement:[]
    })
    return response.status(201).send()
})
app.get("/statement",verifyIfExistsAccountCPF,(request,response)=>{

const {customer} = request

return response.json(customer.statement)

})
app.post("/deposit",verifyIfExistsAccountCPF,(request,response) => {
    const {description, amount} = request.body
    const {customer} = request
    const statementOperator = {
        description,
        amount,
        date : new Date(),
        type : 'Credit',

    }
    customer.statement.push(statementOperator)
    return response.status(201).send()
})
app.post("/withdraw",verifyIfExistsAccountCPF,(request,response) => {
    const { amount} = request.body
    const {customer} = request
    const balance = getBalance(customer.statement)
    if(balance < amount){
        return response.status(400).json({error:"Insuffcient funds!"})
    }
    const statementOperator = {
        amount,
        date : new Date(),
        type : 'Debit',

    }
    customer.statement.push(statementOperator)
    return response.status(201).send()
})
app.get("/statement/date", verifyIfExistsAccountCPF, (request, response)=>{
    
    const {customer} = request;
    const {date} = request.query;

        
    const dateFormat = moment(date,'DD/MM/YYYY').format('MMMM Do YYYY, h:mm:ss a')

    const statement = customer.statement.filter(
    (statement)=>
    statement.created_at === 
    new Date(dateFormat).toDateString()
    
);
    

    return response.json(statement);

    
});


app.listen(3333)
