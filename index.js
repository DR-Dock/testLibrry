const express = require('express')
const _ = require('lodash');
const mysql = require('mysql2/promise');
const path = require('path');
const app = express()
const port = 3000
let connection; 
let autorizer;
initDb().then(main);





function main(){
	
app.set("view engine", "ejs");

app.get('/', async (req, res) => {

if('bookName' in req.query) {
	await query(`CREATE OR REPLACE VIEW R40 AS SELECT * FROM books INNER JOIN authors ON books.id_author_book = authors.id_author WHERE book_name LIKE '%${req.query.bookName}%';`)
 let rows =	await query('SELECT id_book,book_name,id_author,surname,name,patronymic,publishing_house,returned_date,publishing_year,id_rental,MAX(took_date) AS took_date FROM R40 LEFT JOIN rental ON R40.id_book = rental.id_book_rental GROUP BY id_book;')
res.render('index', {rows: rows})
}else{
	await query('CREATE OR REPLACE VIEW R9 AS SELECT * FROM authors INNER JOIN books ON authors.id_author = books.id_author_book;')
 		const rows = await query('SELECT id_book,book_name,id_author,surname,name,patronymic,publishing_house,returned_date,publishing_year,id_rental,MAX(took_date) AS took_date FROM R9 LEFT JOIN rental ON R9.id_book = rental.id_book_rental GROUP BY id_book;')
 		res.render('index', {rows: rows})

}
		
   
})

app.get('/books/:bookId-:nameBook', async (req, res) => {
await query(`CREATE OR REPLACE VIEW R5 AS SELECT * FROM books INNER JOIN rental ON books.id_book = rental.id_book_rental WHERE id_book = ${req.params.bookId};`)
const rows = await query('SELECT * FROM students INNER JOIN R5 ON R5.id_student_rental = students.id_student;')
 res.render('book' , {rows: rows,nameBook: req.params.nameBook})  
})

app.get('/returnBook/:bookId-:option', async (req, res) => {
if (req.params.option == 1) {
	await query(`CREATE OR REPLACE VIEW retBook AS SELECT * FROM books INNER JOIN rental ON books.id_book = rental.id_book_rental WHERE id_book = ${req.params.bookId} AND returned_date IS NULL;`)
const rows = await query('SELECT * FROM retBook INNER JOIN students ON retBook.id_student_rental = students.id_student;')
 res.render('returnBook' , {rows: rows,option: 1}) 
}
else{
	console.log('wqe')
	await query(`UPDATE rental SET returned_date = CURRENT_DATE() WHERE id_book_rental = ${req.params.bookId} AND returned_date IS NULL;`)
	res.redirect('/')
}
 
})

app.get('/rental/', async (req, res) => {
await query(`CREATE OR REPLACE VIEW R6 AS SELECT * FROM rental INNER JOIN books ON rental.id_book_rental = books.id_book;`)
const rows = await query('SELECT * FROM R6 INNER JOIN students ON R6.id_student_rental = students.id_student;')
 res.render('rental' , {rows: rows})  
})

app.get('/ADDbook/:id_author-:namaB-:pubHouse-:pubYear', async (req, res) => {
if (!_.isEmpty(req.query)) 
{
	if (req.query['book_name'] != '' & req.query['publishing_house'] != '' & req.query['publishing_year'] != '' & req.query['name'] != '' & req.query['patronymic'] != '' & req.query['surname'] != '')
	{
		const autrs = await query(`SELECT * FROM authors WHERE name = '${req.query.name}' AND patronymic = '${req.query.patronymic}' AND surname = '${req.query.surname}';`)
		if (autrs.length != 0) 
		{
			res.render('add_book' , {option: "authorsList", rows : autrs,book : [req.query.book_name,req.query.publishing_house,req.query.publishing_year]})
		}
		else
		{
		await query(`INSERT INTO authors(name,patronymic,surname) VALUES ('${req.query.name}','${req.query.patronymic}','${req.query.surname}');`)
			const aut = await query(`SELECT * FROM authors WHERE id_author=(SELECT MAX(id_author) FROM authors);`)
			await query(`INSERT INTO books(book_name,publishing_house,publishing_year,id_author_book) VALUES (${req.query.book_name},${req.query.publishing_house},${req.query.publishing_year},${aut[0].id_author});`)
			res.render('add_book',{option: "AddAuthorAndBook", rows : [],book :[]})	
		}
	}
	else
	{
		res.render('add_book' , {option: "errorData", rows : [],book :[]})		
	}
}
else
{

	if (req.params.id_author == 0) {res.render('add_book' , {option: "addDataForm", rows : [],book :[]})}
	else
	{
		console.log(`'${req.params.nameB}','${req.params.pubHouse}',${req.params.pubYear},${req.params.id_author}`)
		await query(`INSERT INTO books(book_name,publishing_house,publishing_year,id_author_book) VALUES ('${req.params.namaB}','${req.params.pubHouse}',${req.params.pubYear},${req.params.id_author});`)
		res.render('add_book',{option: "AndBook", rows : [],book :[]})
	}
	
}
//await query(`CREATE OR REPLACE VIEW R6 AS SELECT * FROM rental INNER JOIN books ON rental.id_book_rental = books.id_book;`)
//const rows = await query('SELECT * FROM R6 INNER JOIN students ON R6.id_student_rental = students.id_student;')
 //res.render('rental' , {rows: rows})  
})

app.get('/ADDrental/:bookID-:opt-:studID', async (req, res) => {
if (!_.isEmpty(req.query)) 
{
	if (req.query['name'] != '' & req.query['patronymic'] != '' & req.query['newStud'] != '') 
	{
		if ('newStud' in req.query) 
		{
			await query(`INSERT INTO students(name,patronymic,surname) VALUES ('${req.query.name}','${req.query.patronymic}','${req.query.surname}');`)
			const stud = await query(`SELECT * FROM students WHERE id_student=(SELECT MAX(id_student) FROM students);`)
			await query(`INSERT INTO rental(id_student_rental,id_book_rental,took_date) VALUES (${stud[0].id_student},${req.params.bookID}, CURRENT_DATE());`)
			res.render('addRental',{book_id: req.params.bookID,studs: [], option: 2})
		}
		else
		{
			const studs = await query(`SELECT * FROM students WHERE name = '${req.query.name}' AND patronymic = '${req.query.patronymic}' AND surname = '${req.query.surname}';`)
			if (studs.length != 0) 
			{
				res.render('addRental',{book_id: req.params.bookID,studs: studs, option: 4})
			}
			else
			{
				res.render('addRental',{book_id: req.params.bookID,studs: studs, option: 3})
			}
		}
	}
	else
	{
				res.render('addRental',{book_id: req.params.bookID,studs: [], option: 5})
	}

}
	else
	{
		if (req.params.opt == 6) {res.render('addRental',{book_id: req.params.bookID,studs: [], option: 1})}
		else if(req.params.opt == 7) {
			await query(`INSERT INTO rental(id_student_rental,id_book_rental,took_date) VALUES (${req.params.studID},${req.params.bookID}, CURRENT_DATE());`)
			res.render('addRental',{book_id: req.params.bookID,studs: [], option: 6})
		}
	}  
})

app.get('/publishing_house/:namePH', async (req, res) => {
const rows = await query(`SELECT * FROM books WHERE publishing_house = "${req.params.namePH}";`)
 res.render('publishing_house' , {rows: rows})  
})

function AngryStud(arr) {

	let id_mas = []
  let newarr = arr.map(elem=> [elem.id, elem.num])
  newarr.sort((a,b)=>b[1] - a[1])
  id_mas.push(newarr[0][0])
	for (let i = 1; i < newarr.length; i++) {
		if (newarr[0][1] == newarr[i][1]) {
			id_mas.push(newarr[i][0])
		}
	}
if (id_mas.length != 1) {
let obj = {}
	for (let i = 0; i < id_mas.length; i++) {
		let mas = []
		for (let j = 0; j < newarr.length; j++) {
			if (id_mas[i] == newarr[j][0]) {
				mas.push(newarr[j][1])
			}
		}
		obj[id_mas[i]] = mas.sort(function(a,b){ 
  return b - a
})
	}
	for (key in obj) {
  obj[key] = obj[key].reduce(function(sum, current) {
  return sum + current;
}, 0);
}
const max = Object.keys(obj).reduce((a, v) => Math.max(a, obj[v]), -Infinity);
const result = Object.keys(obj).filter(v => obj[v] === max);

return result;

}
else{return id_mas;}
  
}

app.get('/students', async (req, res) => {
const rows = await query(`SELECT * FROM students;`)
await query('DROP TABLE IF EXISTS rentalCopy;')
await query('DROP VIEW IF EXISTS RANGETIME;')
await query('DROP VIEW IF EXISTS rent;')
await query('CREATE TABLE rentalCopy(id_rental INT,id_student_rental INT,id_book_rental INT,took_date DATE,returned_date DATE);')
await query('INSERT INTO rentalCopy SELECT * FROM rental;')
await query(`CREATE OR REPLACE VIEW rent AS SELECT *  FROM rentalCopy;`)
await query(`UPDATE rent SET returned_date = CURRENT_DATE() WHERE returned_date IS NULL;`)
await query(`CREATE OR REPLACE VIEW RANGETIME AS SELECT id_student AS id,ROUND(TIME_TO_SEC(timediff(returned_date,took_date))/60/60) AS num FROM students INNER JOIN rent ON students.id_student = rent.id_student_rental;`)
const studs = await query(`SELECT id AS id, CAST(num AS UNSIGNED) AS num FROM RANGETIME;`)
await query('DROP TABLE IF EXISTS rentalCopy;')
//SELECT ROUND(TIME_TO_SEC(timediff(took_date,returned_date))/60/60) AS num
const stud = await query(`SELECT * FROM students WHERE id_student = ${AngryStud(studs)[0]};`)
 res.render('students' , {rows: rows, angr : stud[0]})  
})

app.get('/authors', async (req, res) => {
if ('year' in req.query) {
	await query('DROP VIEW IF EXISTS R4;')
	await query('DROP VIEW IF EXISTS R3;')
	await query('DROP VIEW IF EXISTS R2;')
	await query('DROP VIEW IF EXISTS R1;')
	let rows = []
	await query('CREATE OR REPLACE VIEW R1 AS SELECT id_book_rental FROM rental WHERE YEAR(took_date) ='+req.query.year+';')
	if ((await query('SELECT * FROM R1;')).length != 0) {
		await query(`CREATE OR REPLACE VIEW R2 AS SELECT id_author_book,book_name FROM books INNER JOIN R1 ON books.id_book = R1.id_book_rental;`)
		await query(`CREATE OR REPLACE VIEW R3 AS SELECT id_author_book, COUNT(*) AS COUNT FROM R2 GROUP BY id_author_book;`)
		await query(`CREATE OR REPLACE VIEW R4 AS SELECT id_author_book, MAX(COUNT) FROM R3;`)
		rows = await query('SELECT * FROM R4 INNER JOIN authors ON R4.id_author_book = authors.id_author;')
	}
res.render('authors' , {rows: rows})
}
else{
const rows = await query(`SELECT * FROM authors;`)
 res.render('authors' , {rows: rows})  
}})

app.get('/rentalStud/:studentId', async (req, res) => {
await query(`CREATE OR REPLACE VIEW R7 AS SELECT * FROM rental INNER JOIN students ON rental.id_student_rental = students.id_student WHERE id_student = ${req.params.studentId};`)
const rows = await query('SELECT * FROM books INNER JOIN R7 ON books.id_book = R7.id_book_rental;')
res.render('rentalStud' , {rows: rows})  
})

app.get('/authors/:authorId', async (req, res) => {
const rows = await query(`SELECT * FROM books WHERE id_author_book = ${req.params.authorId};`)
const author = await query(`SELECT * FROM authors WHERE id_author = ${req.params.authorId};`)
res.render('authorBooks' , {rows: rows, author: author})  
})

app.get('/returnBook/:id_book', async (req, res) => {
await query(`CREATE OR REPLACE VIEW R10 AS SELECT * FROM rental WHERE id_book_rental = ${req.params.id_book};`)
await query(`CREATE OR REPLACE VIEW R11 AS SELECT * FROM R10 INNER JOIN students ON R10.id_student_rental = students.id_student;`)
const rows = await query(`SELECT * FROM R11 INNER JOIN books ON R11.id_book_rental = books.id_book;`)
res.render('returnBook' , {rows: rows})  
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
}

 


async function query(q) {

  const [rows, fields] = await connection.execute(q);
  
  return rows;
}
 
 

 
async function initDb(){
  // create the connection
    connection = await mysql.createConnection({  
  host     : 'localhost',
  user     : 'root',
  database : 'library_db',
  password : 'q1w2e3r4'});
}