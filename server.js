/**
* @name server.js
* @file Servidor de TheEvilBlog
* @author Esteban Padilla <ep@estebanpadilla.com>
* @version 1.0.3
*/

//Dependencies
var http = require('http');
var fs = require('fs');
const path = require('path');
var uniqid = require('uniqid');
var url = require('url');

//Varibles
var port = 3000;
var hostName = 'localhost';

var server = http.createServer(function (request, response) {

	var parseUrl = url.parse(request.url, true);
	requestPath = parseUrl.pathname;
	requestPath = requestPath.replace(/^\/+|\/+$/g, '');
	var method = request.method;

	switch (requestPath) {
		case 'posts':
			switch (method) {
				case 'OPTIONS':
					respondToOptions(request, response);
					break;
				case 'GET':
					getPosts(request, response);
					break;
				case 'POST':
					postPost(request, response);
					break;
				case 'PATCH':
					updatePost(request, response);
					break;
				case 'DELETE':
					deletePost(request, response, parseUrl.query.key);
					break;
				default:
					send404(request, response);
					break;
			}
			break;
		default:
			console.log('Request not process.');
			send404(request, response);
			break;
	}
});

server.listen(port, hostName, function () {
	console.log('TheEvilBlog Server is runnning!');
});

function loadPosts() {
	return new Promise(function (resolve, reject) {
		fs.readFile(path.resolve(process.cwd(), './data/posts.json'), function (err, data) {
			if (err) {
				reject(null);
			} else {
				var posts = JSON.parse(data);
				resolve(posts);
			}
		})
	});
}

function savePosts(posts) {
	return new Promise(function (resolve, reject) {
		fs.writeFile(path.resolve(process.cwd(), './data/posts.json'), JSON.stringify(posts), function (err) {
			if (err) {
				reject();
			} else {
				resolve();
			}
		})
	});
}

function getPosts(request, response) {
	setResponseHeaders(request, response);
	loadPosts().then(function (posts) {

		response.writeHead(200, {
			'Content-Type': 'application/json'
		});

		response.write(JSON.stringify(posts));
		response.end();

	}).catch(function () {
		send404(request, response)
	});
}

function postPost(request, response) {

	setResponseHeaders(request, response);

	let buffer = [];
	let post = null;
	request.on('data', function (chunk) {
		buffer.push(chunk);
	});

	request.on('end', function () {
		buffer = Buffer.concat(buffer).toString();
		post = JSON.parse(buffer);

		loadPosts().then(function (posts) {
			posts[uniqid()] = post;
			savePosts(posts).then(function () {
				response.writeHead(200);
				response.end();
			}).catch(function () {
				send404(request, response);
			});
		}).catch(function () {
			send404(request, response);
		});
	});
}

function updatePost(request, response) {

	setResponseHeaders(request, response);

	let buffer = [];
	let post = null;

	request.on('data', function (chunk) {
		buffer.push(chunk);
	});

	request.on('end', function () {

		buffer = Buffer.concat(buffer).toString();
		post = JSON.parse(buffer);

		loadPosts().then(function (posts) {

			for (const key in posts) {
				for (const keyToUpdate in post) {
					if (key === keyToUpdate) {
						posts[key] = post[key];
					}
				}
			}

			savePosts(posts).then(function () {
				console.log(posts);
				response.writeHead(200);
				response.end();
			}).catch(function () {
				send404(request, response);
			});
		}).catch(function () {
			send404(request, response);
		});
	});
}

function deletePost(request, response, key) {

	setResponseHeaders(request, response);

	loadPosts().then(function (posts) {

		delete posts[key];

		savePosts(posts).then(function () {
			response.writeHead(200);
			response.end();
		}).catch(function () {
			send404(request, response);
		});
	}).catch(function () {
		send404(request, response);
	});
}

function send404(request, response) {
	setResponseHeaders(request, response);
	response.writeHead(404, {
		'Content-Type': 'application/json'
	});
	response.end();
}

function respondToOptions(request, response) {
	setResponseHeaders(request, response);
	response.writeHead(200);
	response.end();
}

function setResponseHeaders(request, response) {
	response.setHeader('Access-Control-Allow-Origin', request.headers['origin']);
	response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
	if (request.headers['content-type']) {
		response.setHeader('Content-Type', request.headers['content-type']);
	}
	response.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Origin, Access-Control-Allow-Methods, Content-Type');
}


