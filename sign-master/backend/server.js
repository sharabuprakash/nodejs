const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname + '/.env') });
const express = require('express');
const favicon = require('express-favicon');
const bcrypt = require('bcrypt');
const cron = require('node-cron');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const port = process.env.PORT || 8080;
const ip = process.env.IP || '0.0.0.0';
const app = express();
const AWS = require('aws-sdk');
var upload = require('express-fileupload');
var docxConverter = require('docx-pdf');
var fs = require('fs');
const compression = require('compression');
const SignReminderMail = require('./mails/sign-reminder');

const mailer = require('./utils/mailer');
const APP_CONFIG = require('./config');

const extend_pdf = '.pdf';
const extend_docx = '.docx';

app.use(upload());
app.use(
	compression({
		level: 9,
	}),
);

var enableCORS = function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header(
		'Access-Control-Allow-Headers',
		'Content-Type, token, Content-Length, X-Requested-With, *',
	);
	if ('OPTIONS' === req.method) {
		res.sendStatus(200);
	} else {
		next();
	}
};
app.all('/*', function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header(
		'Access-Control-Allow-Headers',
		'Content-Type, token, Content-Length, X-Requested-With, *',
	);
	next();
});
app.use(enableCORS);

app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '500mb' }));

var salt = 10;

const s3 = new AWS.S3({
	accessKeyId: process.env.S3_ACCESS_KEY,
	secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
});

const uri = `${process.env.DB_CONNECTION}`;

/////////////////////////////////////Common Functions//////////////////////////////////////////////

app.post('/api/getip', function (req, res) {
	var ip = req.ip;
	res.send(ip);
});

app.post('/api/upload', function (req, res) {
	if (req.body.files) {
		var First_name = 'default';

		var initialPath = path.join(
			__dirname,
			`./uploads/${First_name}${extend_docx}`,
		);
		console.log('initial path');
		//Path where the converted pdf will be placed/uploaded
		var upload_path = path.join(
			__dirname,
			`./uploads/${First_name}${extend_pdf}`,
		);
		console.log('upload path');
		var base64Data = new Buffer.from(req.body.files, 'base64');
		console.log(base64Data);

		require('fs').writeFile(initialPath, base64Data, function (err) {
			console.log(err);
			docxConverter(initialPath, upload_path, function (err, result) {
				if (err) {
					console.log(err);
				}
			});
		});
	} else {
		res.send('No File selected !');
		res.end();
	}
});

app.post('/api/loginapi', function (req, res) {
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var query = { UserEmail: req.body.UserEmail };
		const collection = client.db('UsersDB').collection('Users');
		//console.log(collection);

		collection.findOne(query, function (err, result) {
			if (err) throw err;
			if (result) {
				bcrypt.compare(
					req.body.UserPassword,
					result.UserPassword,
					function (bcrypterr, bcryptresult) {
						if (bcryptresult == true) {
							if (
								result.UserActivated === true &&
								result.SignID != ''
							) {
								var userdata = {
									UserID: result.UserID,
									UserEmail: result.UserEmail,
									UserFullName:
										result.UserFirstName +
										' ' +
										result.UserLastName,
									Status: 'login successful',
								};
								res.send(userdata);
							} else if (
								result.UserActivated === true &&
								result.SignID === ''
							) {
								var userdata = {
									UserID: result.UserID,
									UserEmail: result.UserEmail,
									UserFullName:
										result.UserFirstName +
										' ' +
										result.UserLastName,
									Status: 'sign id required',
								};
								res.send(userdata);
							} else if (result.UserActivated === false) {
								var userdata = {
									UserID: result.UserID,
									UserEmail: result.UserEmail,
									UserFullName:
										result.UserFirstName +
										' ' +
										result.UserLastName,
									Status: 'activate account',
								};
								res.send(userdata);
							}
						} else {
							var userdata = {
								Status: 'wrong password',
							};
							res.send(userdata);
							// redirect to login page
						}
					},
				);
			} else {
				var userdata = {
					Status: 'user not found',
				};
				res.send(userdata);
			}
			client.close();
		});
		// perform actions on the collection object
	});
});

app.post('/api/registerapi', function (req, res) {
	//console.log(req.body);
	bcrypt.hash(req.body.UserPassword, salt, (bcrypterr, encrypted) => {
		req.body.UserPassword = encrypted;

		const client = new MongoClient(uri, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		client.connect((err) => {
			const collection = client.db('UsersDB').collection('Users');
			var registerUser = {
				UserID: req.body.UserID,
				UserEmail: req.body.UserEmail,
				UserPassword: req.body.UserPassword,
				UserNumber: req.body.UserNumber,
				UserFirstName: req.body.UserFirstName,
				UserLastName: req.body.UserLastName,
				UserTitle: req.body.UserTitle,
				UserCompany: req.body.UserCompany,
				UserIndustry: req.body.UserIndustry,
				UserCountry: req.body.UserCountry,
				UserReason: req.body.UserReason,
				UserThirdPartyIntegration: req.body.UserThirdPartyIntegration,
				UserSecurityQuestion: req.body.UserSecurityQuestion,
				UserSecurityAnswer: req.body.UserSecurityAnswer,
				UserActivated: req.body.UserActivated,
				SignID: req.body.SignID,
				Request: req.body.Requests,
			};
			var query = { UserEmail: req.body.UserEmail };
			//console.log(collection);
			collection.findOne(query, function (err, result) {
				if (err) throw err;
				//console.log(result);
				if (result) {
					res.send('User already exists');
				} else {
					collection.insertOne(registerUser, function (err, result) {
						if (err) res.send(err);
						if (result) {
							res.send('registered');
						}
						//console.log("registered");
						client.close();
						// perform actions on the collection object
					});
				}
			});
		});
	});
});

app.post('/api/saveuserdata', function (req, res) {
	//console.log(req.body);
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var query = { UserID: req.body.UserID };
		var newvalues = {
			$set: {
				UserFirstName: req.body.UserFirstName,
				UserLastName: req.body.UserLastName,
				UserEmail: req.body.UserEmail,
				UserNumber: req.body.UserNumber,
			},
		};
		const collection = client.db('UsersDB').collection('Users');
		//console.log(collection);
		collection.updateOne(query, newvalues, function (err, result) {
			if (err) throw err;
			if (result) {
				res.send('settings saved');
			} else {
				res.send('settings not saved');
			}
			client.close();
		});
	});
});

app.post('/api/resetpassword', function (req, res) {
	bcrypt.hash(req.body.UserPassword, salt, (bcrypterr, encrypted) => {
		req.body.UserPassword = encrypted;
		//console.log(req);
		const client = new MongoClient(uri, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		client.connect((err) => {
			var query = { UserEmail: req.body.UserEmail };
			var newvalues = { $set: { UserPassword: req.body.UserPassword } };
			const collection = client.db('UsersDB').collection('Users');
			//console.log(collection);
			collection.updateOne(query, newvalues, function (err, result) {
				if (err) res.send(err);
				if (result) {
					res.send('reset');
				}

				client.close();
			});
			// perform actions on the collection object
		});
	});
});

app.post('/api/activate', function (req, res) {
	//console.log(req);
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var query = { UserID: req.body.UserID };
		var newvalues = { $set: { UserActivated: req.body.UserActivated } };
		const collection = client.db('UsersDB').collection('Users');
		//console.log(collection);
		collection.updateOne(query, newvalues, function (err, result) {
			if (err) throw err;
			res.send('activated');
			client.close();
		});
		// perform actions on the collection object
	});
});

app.post('/api/signature', function (req, res) {
	//console.log(req);
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var query = { UserID: req.body.UserID };
		var newvalues = {
			$set: {
				SignID: req.body.SignID,
				SignImage: req.body.SignImage,
				SignImageBox: req.body.SignImageBox,
				Initials: req.body.Initials,
				InitialsBox: req.body.InitialsBox,
			},
		};
		const collection = client.db('UsersDB').collection('Users');
		//console.log(collection);
		collection.updateOne(query, newvalues, function (err, result) {
			if (err) throw err;
			if (result) {
				res.send('signed');
			} else {
				res.send('not signed');
			}
			client.close();
		});
		// perform actions on the collection object
	});
});

app.post('/api/profilepic', function (req, res) {
	//console.log(req);
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var query = { UserID: req.body.UserID };
		var newvalues = { $set: { ProfileImage: req.body.ProfileImage } };
		const collection = client.db('UsersDB').collection('Users');
		//console.log(collection);
		collection.updateOne(query, newvalues, function (err, result) {
			if (err) throw err;
			if (result) {
				res.send('updated');
			} else {
				res.send('not updated');
			}
			client.close();
		});
		// perform actions on the collection object
	});
});

/////////////////////////////////////Document/Envelope Functions//////////////////////////////////////////////

app.post('/api/adddocumentdata', function (req, res) {
	//console.log(req);
	var query = { DocumentID: req.body.DocumentID };
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var dataupdate = {
			$set: {
				DocumentName: req.body.DocumentName,
				DocumentID: req.body.DocumentID,
				OwnerEmail: req.body.OwnerEmail,
				DateCreated: req.body.DateCreated,
				DateStatus: req.body.DateStatus,
				Owner: req.body.Owner,
				Status: req.body.Status,
				DateSent: req.body.DateSent,
				Data: req.body.Data,
				SignOrder: req.body.SignOrder,
				Reciever: [],
				History: [],
			},
		};
		var datainsert = {
			DocumentName: req.body.DocumentName,
			DocumentID: req.body.DocumentID,
			OwnerEmail: req.body.OwnerEmail,
			DateCreated: req.body.DateCreated,
			DateStatus: req.body.DateStatus,
			Owner: req.body.Owner,
			Status: req.body.Status,
			DateSent: req.body.DateSent,
			Data: req.body.Data,
			SignOrder: req.body.SignOrder,
			Reciever: [],
			History: [],
		};
		const collection = client.db('DocumentDB').collection(req.body.Owner);

		collection.findOne(query, function (err, result) {
			if (err) throw err;
			//console.log(result);
			if (result) {
				collection.updateOne(query, dataupdate, function (
					errorupdate,
					resultupdate,
				) {
					if (errorupdate) res.send(errorupdate);
					if (resultupdate) {
						res.send('update done');
					} else {
						//console.log('not ther');
					}
					client.close();

					// perform actions on the collection object
				});
			} else {
				collection.insertOne(datainsert, function (
					errinsrt,
					resultinsert,
				) {
					if (errinsrt) res.send(errinsrt);
					if (resultinsert) {
						res.send('insert done');
					}
					client.close();
					// perform actions on the collection object
				});
			}
		});
	});
});

app.post('/api/updatedocumentdata', function (req, res) {
	//console.log(req);
	var query = { DocumentID: req.body.DocumentID };
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var dataupdate = {
			$set: {
				DateStatus: req.body.DateStatus,
				DocumentID: req.body.DocumentID,
				Data: req.body.Data,
			},
		};
		const collection = client.db('DocumentDB').collection(req.body.Owner);

		collection.updateOne(query, dataupdate, function (
			errorupdate,
			resultupdate,
		) {
			if (errorupdate) res.send(errorupdate);
			if (resultupdate) {
				res.send('update done');
			} else {
				//console.log('not ther');
			}
			client.close();

			// perform actions on the collection object
		});
	});
});

app.post('/api/updatedocumentstatus', function (req, res) {
	//console.log(req);
	var query = { DocumentID: req.body.DocumentID };
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var dataupdate = {
			$set: {
				Status: req.body.Status,
				PreviousStatus: req.body.PreviousStatus,
			},
		};
		const collection = client.db('DocumentDB').collection(req.body.Owner);

		collection.updateOne(query, dataupdate, function (
			errorupdate,
			resultupdate,
		) {
			if (errorupdate) res.send(errorupdate);
			if (resultupdate) {
				res.send('update done');
			} else {
				//console.log('not ther');
			}
			client.close();

			// perform actions on the collection object
		});
	});
});

app.post('/api/updaterecieverdata', function (req, res) {
	//console.log(req);
	var query = { DocumentID: req.body.DocumentID };
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var dataupdate = {
			$set: {
				Reciever: req.body.Reciever,
			},
		};
		const collection = client.db('DocumentDB').collection(req.body.Owner);

		collection.updateOne(query, dataupdate, function (
			errorupdate,
			resultupdate,
		) {
			if (errorupdate) res.send(errorupdate);
			if (resultupdate) {
				res.send('update reciever done');
			} else {
				//console.log('error');
			}
			client.close();

			// perform actions on the collection object
		});
	});
});

app.post('/api/updaterequestdata', function (req, res) {
	//console.log(req);
	var query = { UserID: req.body.UserID };
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var dataupdate = {
			$set: {
				Request: req.body.Request,
			},
		};
		const collection = client.db('UsersDB').collection('Users');

		collection.updateOne(query, dataupdate, function (
			errorupdate,
			resultupdate,
		) {
			if (errorupdate) res.send(errorupdate);
			if (resultupdate) {
				res.send('update request done');
			} else {
				//console.log('error');
			}
			client.close();

			// perform actions on the collection object
		});
	});
});

app.post('/api/getdocdata', function (req, res) {
	//console.log(req);
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var query = { DocumentID: req.body.DocumentID };
		const collection = client.db('DocumentDB').collection(req.body.Owner);
		//console.log(collection);

		collection.findOne(query, async function (err, result) {
			if (err) throw err;
			if (result) {
				const owner = await client
					.db('UsersDB')
					.collection('Users')
					.findOne({
						UserID: result.Owner,
					});

				var docdata = {
					Data: {
						...result.Data,
					},
					SignOrder: result.SignOrder,
					DocStatus: result.Status,
					Document: result,
					Status: 'doc data done',
					Owner: owner,
				};
				delete result.Data;
				res.send(docdata);
			} else {
				var docdata = {
					Status: 'doc not found',
				};
				res.send(docdata);
			}
			client.close();
		});
		// perform actions on the collection object
	});
});

app.post('/api/addreciever', function (req, res) {
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect(async (err) => {
		const Reciever = req.body.Reciever;
		var dataupdate = {
			$set: {
				Status: req.body.Status,
				SignOrder: req.body.SignOrder,
				DateSent: req.body.DateSent,
				Reciever: req.body.Reciever,
			},
		};

		const documentCollection = client
			.db('DocumentDB')
			.collection(req.body.Owner);
		const userCollection = client.db('UsersDB').collection('Users');

		const user = await userCollection.findOne({ UserID: req.body.Owner });

		const newAddressBook = {
			...user.AddressBook,
		};

		Reciever.forEach((_) => {
			const exists =
				newAddressBook[_.RecipientEmail] !== null &&
				newAddressBook[_.RecipientEmail] !== undefined;
			console.log(_.RecipientEmail, exists);

			newAddressBook[_.RecipientEmail] = {
				Name: _.RecipientName,
				Count: exists ? newAddressBook[_.RecipientEmail].Count + 1 : 1,
			};
		});

		try {
			await documentCollection.updateOne(
				{ DocumentID: req.body.DocumentID },
				dataupdate,
			);
			await userCollection.updateOne(
				{ UserID: req.body.Owner },
				{
					$set: {
						AddressBook: newAddressBook,
					},
				},
			);
			res.send('reciever done');
		} catch (e) {
			res.send(e);
		}

		client.close();
	});
});

app.get(`/api/users/:id/address-books`, (req, res) => {
	const { id } = req.params;
	const keyword = (req.query.keyword || '').toLowerCase();

	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect(async (err) => {
		const user = await client
			.db('UsersDB')
			.collection('Users')
			.findOne({ UserID: id });

		if (!user || !user.AddressBook) {
			res.send([]);
		} else {
			let addressBooks = Object.keys(user.AddressBook).map((_) => {
				return {
					Email: _,
					Name: user.AddressBook[_].Name,
					Count: user.AddressBook[_].Count,
				};
			});
			if (keyword) {
				addressBooks = addressBooks.filter(
					(user) =>
						user.Email.toLowerCase().indexOf(keyword) !== -1 ||
						user.Name.toLowerCase().indexOf(keyword) !== -1,
				);
			}
			addressBooks.sort((x, y) => y.Count > x.Count);
			res.send(addressBooks);
		}

		client.close();
	});
});

app.post('/api/getReciever', function (req, res) {
	//console.log(req);
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var query = { DocumentID: req.body.DocumentID };
		const collection = client.db('DocumentDB').collection(req.body.Owner);
		//console.log(collection);

		collection.findOne(query, function (err, result) {
			if (err) throw err;
			if (result) {
				var docdata = {
					Reciever: result.Reciever,
					DocumentName: result.DocumentName,
					OwnerEmail: result.OwnerEmail,
					DocStatus: result.Status,
					DocumentFrom: result.Owner,
					Status: 'got recievers',
				};
				res.send(docdata);
			} else {
				var docdata = {
					Status: 'doc not found',
				};
				res.send(docdata);
			}
			client.close();
		});
		// perform actions on the collection object
	});
});

app.post('/api/getRequests', function (req, res) {
	//console.log(req);
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var query = { UserID: req.body.UserID };
		const collection = client.db('UsersDB').collection('Users');
		//console.log(collection);

		collection.findOne(query, function (err, result) {
			if (err) throw err;
			if (result) {
				var requestdata = {
					Request: result.Request,
					Status: 'got request',
				};
				res.send(requestdata);
			} else {
				var requestdata = {
					Status: 'request not found',
				};
				res.send(requestdata);
			}
			client.close();
		});
		// perform actions on the collection object
	});
});

app.post('/api/getrequestuser', function (req, res) {
	//console.log(req);
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var query = { UserEmail: req.body.UserEmail };
		const collection = client.db('UsersDB').collection('Users');

		collection.findOne(query, function (err, result) {
			if (err) throw err;
			if (result) {
				var userdata = {
					UserID: result.UserID,
					Status: 'user found',
				};
				res.send(userdata);
			} else {
				var userdata = {
					Status: 'user not found',
				};
				res.send(userdata);
			}
			client.close();
		});
		// perform actions on the collection object
	});
});

app.post('/api/postrequest', function (req, res) {
	//console.log(req);
	var query = {
		UserID: req.body.UserID,
	};
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var dataupdate = {
			$set: {
				DocumentName: req.body.DocumentName,
				DocumentID: req.body.DocumentID,
				From: req.body.From,
				FromEmail: req.body.FromEmail,
				RecipientStatus: req.body.RecipientStatus,
				RecipientDateStatus: req.body.RecipientDateStatus,
			},
		};
		var datainsert = {
			DocumentName: req.body.DocumentName,
			DocumentID: req.body.DocumentID,
			From: req.body.From,
			FromEmail: req.body.FromEmail,
			RecipientStatus: req.body.RecipientStatus,
			RecipientDateStatus: req.body.RecipientDateStatus,
		};
		const collection = client.db('UsersDB').collection('Users');

		collection.findOne(query, function (err, result) {
			if (err) throw err;
			//console.log('result:'+result.UserID);

			var userid = req.body.UserID;
			var docid = req.body.DocumentID;

			if (result) {
				collection.updateOne(
					{ UserID: userid },
					{ $push: { Request: datainsert } },
					{ upsert: true },
					function (errinsrt, resultinsert) {
						if (errinsrt) res.send(errinsrt);
						if (resultinsert) {
							res.send('request insert done');
						}
						client.close();
						// perform actions on the collection object
					},
				);
			} else {
				res.send('no user');
				client.close();
			}
		});
	});
});

app.post('/api/getuserdata', function (req, res) {
	//console.log(req);
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var query = { UserID: req.body.UserID };
		const collection = client.db('UsersDB').collection('Users');
		//console.log(collection);

		collection.findOne(query, function (err, result) {
			if (err) throw err;
			if (result) {
				var userdata = {
					user: result,
					Status: 'user found',
				};
				res.send(userdata);
			} else {
				var userdata = {
					Status: 'user not found',
				};
				res.send(userdata);
			}
			client.close();
		});
		// perform actions on the collection object
	});
});

app.post('/api/getmanagedocdata', function (req, res) {
	//console.log(req);
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var query = { Owner: req.body.UserID };
		const collection = client.db('DocumentDB').collection(req.body.UserID);
		//console.log(collection);

		collection.find(query).toArray(function (err, result) {
			if (err) throw err;
			if (result) {
				var docdata = {
					doc: result,
					Status: 'doc found',
				};
				res.send(docdata);
			} else {
				var docdata = {
					Status: 'doc not found',
				};
				res.send(docdata);
			}
			client.close();
		});
		// perform actions on the collection object
	});
});

app.post('/api/getmanagetemplatedata', function (req, res) {
	//console.log(req);
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var query = { Owner: req.body.UserID };
		const collection = client.db('TemplateDB').collection(req.body.UserID);
		//console.log(collection);

		collection.find(query).toArray(function (err, result) {
			if (err) throw err;
			if (result) {
				var templatedata = {
					template: result,
					Status: 'template found',
				};
				res.send(templatedata);
			} else {
				var templatedata = {
					Status: 'template not found',
				};
				res.send(templatedata);
			}
			client.close();
		});
		// perform actions on the collection object
	});
});

/////////////////////////////////////Template Functions//////////////////////////////////////////////

app.post('/api/addtemplatedata', function (req, res) {
	//console.log(req);
	var query = { TemplateID: req.body.TemplateID };
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var dataupdate = {
			$set: {
				TemplateName: req.body.TemplateName,
				TemplateID: req.body.TemplateID,
				OwnerEmail: req.body.OwnerEmail,
				DateCreated: req.body.DateCreated,
				DateStatus: req.body.DateStatus,
				Owner: req.body.Owner,
				Status: req.body.Status,
				DateSent: req.body.DateSent,
				Data: req.body.Data,
				Reciever: [],
			},
		};
		var datainsert = {
			TemplateName: req.body.TemplateName,
			TemplateID: req.body.TemplateID,
			OwnerEmail: req.body.OwnerEmail,
			DateCreated: req.body.DateCreated,
			DateStatus: req.body.DateStatus,
			Owner: req.body.Owner,
			Status: req.body.Status,
			DateSent: req.body.DateSent,
			Data: req.body.Data,
			Reciever: [],
		};
		const collection = client.db('TemplateDB').collection(req.body.Owner);

		collection.findOne(query, function (err, result) {
			if (err) throw err;
			//console.log(result);
			if (result) {
				collection.updateOne(query, dataupdate, function (
					errorupdate,
					resultupdate,
				) {
					if (errorupdate) res.send(errorupdate);
					if (resultupdate) {
						res.send('update done');
					} else {
						//console.log('not ther');
					}
					client.close();

					// perform actions on the collection object
				});
			} else {
				collection.insertOne(datainsert, function (
					errinsrt,
					resultinsert,
				) {
					if (errinsrt) res.send(errinsrt);
					if (resultinsert) {
						res.send('insert done');
					}
					client.close();
					// perform actions on the collection object
				});
			}
		});
	});
});

app.post('/api/gettemplatedata', function (req, res) {
	//console.log(req);
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var query = { TemplateID: req.body.TemplateID };
		const collection = client.db('TemplateDB').collection(req.body.Owner);
		//console.log(collection);

		collection.findOne(query, function (err, result) {
			if (err) throw err;
			if (result) {
				var templatedata = {
					Template: result,
					Status: 'template found',
				};
				res.send(templatedata);
			} else {
				var templatedata = {
					Status: 'template not found',
				};
				res.send(templatedata);
			}
			client.close();
		});
		// perform actions on the collection object
	});
});

app.post('/api/addtemplatereciever', function (req, res) {
	//console.log(req);
	var query = { TemplateID: req.body.TemplateID };
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var dataupdate = {
			$set: {
				TemplateID: req.body.TemplateID,
				Status: req.body.Status,
				DateSent: req.body.DateSent,
				Reciever: req.body.Reciever,
			},
		};
		const collection = client.db('TemplateDB').collection(req.body.Owner);

		collection.updateOne(query, dataupdate, function (
			errorupdate,
			resultupdate,
		) {
			if (errorupdate) res.send(errorupdate);
			if (resultupdate) {
				res.send('reciever done');
			} else {
				//console.log('not ther');
			}
			client.close();

			// perform actions on the collection object
		});
	});
});

/////////////////////////////////////Mail Functions//////////////////////////////////////////////

app.post('/api/sendmail', function (req, res) {
	//console.log("req.body.to is " + req.body.to);
	//console.log("req.body.subject is " + req.body.subject);
	// setup e-mail data with unicode symbols
	let from = req.body.from;

	if (from) {
		from = `${from} via ${APP_CONFIG.APP_NAME}`;
	} else {
		from = APP_CONFIG.APP_NAME;
	}

	var mailOptions = {
		from: `"${from}" <${APP_CONFIG.APP_MAIL_SENDER}>`,
		to: req.body.to, // list of receivers
		subject: req.body.subject, // Subject line
		html: req.body.body, // html body
	};

	mailer.sendMail(mailOptions, function (error, info) {
		console.log(error, info);
		if (error) {
			res.send('Error sending mail: ' + error);
		} else {
			res.send('Mail has been sent!');
		}
	});
});

app.post('/api/sendmailattachments', function (req, res) {
	//console.log("req.body.to is " + req.body.to);
	//console.log("req.body.subject is " + req.body.subject);
	// setup e-mail data with unicodnte symbols
	let from = req.body.from;

	if (from) {
		from = `${from} via ${APP_CONFIG.APP_NAME}`;
	} else {
		from = APP_CONFIG.APP_NAME;
	}

	var mailOptions = {
		from: `"${from}" <${APP_CONFIG.APP_MAIL_SENDER}>`,
		to: req.body.to, // list of receivers
		subject: req.body.subject, // Subject line
		html: req.body.body, // html body
		attachments: req.body.attachments,
	};

	mailer.sendMail(mailOptions, function (error, info) {
		if (error) {
			res.send('Error sending mail: ' + error);
		} else {
			res.send('Mail has been sent!');
		}
	});
});

/////////////////////////////////////S3 Storage Functions//////////////////////////////////////////////

app.post('/api/docupload', function (req, res) {
	//console.log(req);
	var key = '' + req.body.UserID + '/Documents/' + req.body.filename + '.pdf';
	try {
		var buffer = new Buffer.from(
			req.body.filedata.replace(/^data:application\/\w+;base64,/, ''),
			'base64',
		);
	} catch (error) {
		var buffer = new Buffer.from(req.body.filedata, 'base64');
	}

	const params = {
		Bucket: process.env.S3_BUCKET_NAME,
		Key: key,
		Body: buffer,
		ContentEncoding: 'base64',
		ContentType: 'application/pdf',
	};
	s3.upload(params, function (err, data) {
		//console.log(err, data);
		if (data) {
			res.send('document upload success');
		} else {
			res.send('document upload failed:' + err);
		}
	});
});

app.post('/api/templateupload', function (req, res) {
	//console.log(req);
	var key = '' + req.body.UserID + '/Templates/' + req.body.filename + '.pdf';
	try {
		var buffer = new Buffer.from(
			req.body.filedata.replace(/^data:application\/\w+;base64,/, ''),
			'base64',
		);
	} catch (error) {
		var buffer = new Buffer.from(req.body.filedata, 'base64');
	}
	const params = {
		Bucket: process.env.S3_BUCKET_NAME,
		Key: key,
		Body: buffer,
		ContentEncoding: 'base64',
		ContentType: 'application/pdf',
	};
	s3.upload(params, function (err, data) {
		//console.log(err, data);
		if (data) {
			res.send('document upload success');
		} else {
			res.send('document upload failed:' + err);
		}
	});
});

app.post('/api/docdownload', function (req, res) {
	//console.log(req);
	var key = '' + req.body.UserID + '/Documents/' + req.body.filename + '.pdf';

	const params = {
		Bucket: process.env.S3_BUCKET_NAME,
		Key: key,
	};
	s3.getObject(params, (err, data) => {
		if (err) console.error(err);
		if (data) {
			var docdata = {
				data: data.Body,
				Status: 'doc found',
			};
			res.send(docdata);
		} else {
			res.send(err);
		}
	});
});

app.post('/api/templatedownload', function (req, res) {
	//console.log(req);
	var key = '' + req.body.UserID + '/Templates/' + req.body.filename + '.pdf';

	const params = {
		Bucket: process.env.S3_BUCKET_NAME,
		Key: key,
	};
	s3.getObject(params, (err, data) => {
		if (err) console.error(err);
		if (data) {
			var templatedata = {
				data: data.Body,
				Status: 'doc found',
			};
			res.send(templatedata);
		} else {
			res.send(err);
		}
	});
});

/////////////////////////////////////////Node-Cron Functions/////////////////////////////////////////////

const expiry_taskMap = {};
const reminder_taskMap = {};

async function setExpiry(Reciever, UserID, DocumentID) {
	//console.log(Reciever);
	var recievers = Reciever;
	var today = new Date().toLocaleString().replace(',', '');
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	recievers.forEach(function (item, index) {
		//console.log(recievers);
		recievers[index].RecipientStatus = 'Expiring';
		recievers[index].RecipientDateStatus = today;

		client.connect((err) => {
			var queryinside = { UserEmail: item.RecipientEmail };
			const collection = client.db('UsersDB').collection('Users');

			collection.findOne(queryinside, function (err, result) {
				if (err) throw err;
				//console.log(result);
				if (result) {
					var request = result.Request;

					request.forEach(function (item, index) {
						if (request[index].DocumentID === DocumentID) {
							request[index].RecipientStatus = 'Expiring';
							request[index].RecipientDateStatus = today;
						}
					});

					var querydoc = { UserID: result.UserID };
					var newvalues = { $set: { Request: request } };

					client.connect((err) => {
						const collection = client
							.db('UsersDB')
							.collection('Users');
						collection.updateOne(querydoc, newvalues, function (
							innererr,
							innerresult,
						) {
							if (innererr) console.log(innererr);
							if (innerresult) {
								console.log('request set');
							}
						});
					});
				}
			});
		});
	});

	var querydoc = { DocumentID: DocumentID };
	var newvalues = { $set: { Status: 'Expiring', Reciever: recievers } };
	client.connect((err) => {
		const collection = client.db('DocumentDB').collection(UserID);
		collection.updateOne(querydoc, newvalues, function (
			innererr,
			innerresult,
		) {
			if (innererr) console.log(innererr);
			if (innerresult) {
				console.log('cron finished expiry');
			}
		});
	});
}

app.post('/api/expiry', function (req, res) {
	var day = parseInt(req.body.day);
	var month = parseInt(req.body.month);
	var year = parseInt(req.body.year);
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
	client.connect((err) => {
		var query = { DocumentID: req.body.DocumentID };
		const collection = client.db('DocumentDB').collection(req.body.UserID);
		//console.log(collection);
		collection.findOne(query, function (err, result) {
			if (err) throw err;
			if (result) {
				if (req.body.trigger === 'today') {
					var recievers = result.Reciever;
					setExpiry(recievers, req.body.UserID, req.body.DocumentID);
					res.send('expiry cron scheduled');
				} else {
					if (
						result.Status != 'Completed' ||
						result.Status != 'Void' ||
						result.Status != 'Deleted'
					) {
						const task = cron.schedule(
							'0 0 23 ' + day + ' ' + month + ' *',
							() => {
								var recievers = result.Reciever;
								setExpiry(
									recievers,
									req.body.UserID,
									req.body.DocumentID,
								);
								console.log('cron finished expiry');
								res.send('expiry cron scheduled');
							},
							{
								timezone: 'Asia/Kolkata',
							},
						);
						expiry_taskMap[result.DocumentID] = task;
						res.send('Success add job!');
					} else {
						// for some condition in some code
						console.log('expiry cron deleted');
						let my_job = expiry_taskMap[result.DocumentID];
						my_job.destroy();
					}
				}
			} else {
				res.send('expiry cron not scheduled');
			}
			client.close();
		});
		// perform actions on the collection object
	});
});

app.post('/api/reminder', function (req, res) {
	var date = parseInt(req.body.date);
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
	client.connect((err) => {
		var query = { DocumentID: req.body.DocumentID };
		const collection = client.db('DocumentDB').collection(req.body.Owner);
		collection.findOne(query, function (err, result) {
			if (err) throw err;
			if (result) {
				if (
					result.Status != 'Completed' ||
					result.Status != 'Void' ||
					result.Status != 'Deleted'
				) {
					const task = cron.schedule(
						' 0 0 0 */' + date + ' * *',
						() => {
							result.Reciever = (result.Reciever || []).map(
								(receiver, i) => ({
									...receiver,
									RecipientIndex: i,
								}),
							);

							const recipients = [];

							if (result.SignOrder) {
								const nextRecipient = result.Reciever.find(
									(receiver) =>
										receiver.RecipientOption ===
											'Needs to Sign' &&
										receiver.RecipientStatus === 'Sent',
								);
								if (nextRecipient) {
									recipients.push(nextRecipient);
								}
							} else {
								const targets = result.Reciever.filter(
									(receiver) =>
										receiver.RecipientOption ===
											'Needs to Sign' &&
										receiver.RecipientStatus === 'Sent',
								);

								if (targets.length !== 0) {
									targets.forEach((target) => {
										recipients.push(target);
									});
								}
							}

							if (recipients.length !== 0) {
								recipients.forEach((recipient) => {
									SignReminderMail(result, recipient);
								});
							}
							res.send('reminder cron scheduled');
							console.log('cron started reminder');
						},
						{
							timezone: 'Asia/Kolkata',
						},
					);
					reminder_taskMap[result.DocumentID] = task;
					res.send('Success add job!');
				} else {
					// for some condition in some code
					console.log('reminder cron deleted');
					let my_job = reminder_taskMap[result.DocumentID];
					my_job.destroy();
				}
			} else {
				res.send('reminder cron not scheduled');
			}
			client.close();
		});
		// perform actions on the collection object
	});
});

////////////////////////////////////////History Functions////////////////////////////////////////////////

app.post('/api/posthistory', function (req, res) {
	//console.log(req);
	var query = {
		DocumentID: req.body.DocumentID,
	};
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var dataupdate = {
			$set: {
				HistoryTime: req.body.HistoryTime,
				HistoryUser: req.body.HistoryUser,
				HistoryAction: req.body.HistoryAction,
				HistoryActivity: req.body.HistoryActivity,
				HistoryStatus: req.body.HistoryStatus,
			},
		};
		var datainsert = {
			HistoryTime: req.body.HistoryTime,
			HistoryUser: req.body.HistoryUser,
			HistoryAction: req.body.HistoryAction,
			HistoryActivity: req.body.HistoryActivity,
			HistoryStatus: req.body.HistoryStatus,
		};
		const collection = client.db('DocumentDB').collection(req.body.Owner);

		collection.findOne(query, function (err, result) {
			if (err) throw err;
			//console.log('result:'+result.UserID);

			var docid = req.body.DocumentID;

			if (result) {
				collection.updateOne(
					{ DocumentID: docid },
					{ $push: { History: datainsert } },
					{ upsert: true },
					function (errinsrt, resultinsert) {
						if (errinsrt) res.send(errinsrt);
						if (resultinsert) {
							res.send('history insert done');
						}
						client.close();
						// perform actions on the collection object
					},
				);
			} else {
				res.send('no doc');
				client.close();
			}
		});
	});
});

app.post('/api/gethistory', function (req, res) {
	//console.log(req);
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	client.connect((err) => {
		var query = { DocumentID: req.body.DocumentID };
		const collection = client.db('DocumentDB').collection(req.body.Owner);
		//console.log(collection);

		collection.findOne(query, function (err, result) {
			if (err) throw err;
			if (result) {
				var historydata = {
					history: result.History,
					Status: 'history found',
				};
				res.send(historydata);
			} else {
				var historydata = {
					Status: 'history not found',
				};
				res.send(historydata);
			}
			client.close();
		});
		// perform actions on the collection object
	});
});

////////////////////////////////////Boilerplate functions///////////////////////////////////////////////

// app.use(favicon(__dirname + '/build/favicon.ico'));
// the __dirname is the current directory from where the script is running
app.use(express.static(__dirname));
// app.use(express.static(path.join(__dirname, 'build')));
app.get('/ping', function (req, res) {
	return res.send('pong');
});
// app.get('/*', function (req, res) {
// 	res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

app.listen(port, ip, function () {
	console.log('Server is running on Port: ' + port);
});
