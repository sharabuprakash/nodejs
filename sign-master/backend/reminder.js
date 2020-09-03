const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname + '/.env') });

const SignReminderMail = require('./mails/sign-reminder');
const MongoClient = require('mongodb').MongoClient;
const uri = `${process.env.DB_CONNECTION}`;

const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const argv = process.argv;
if (argv.length !== 3) {
	console.log(`
    ____                           __   ____                 _           __         
   / __ \\___  ________  ____  ____/ /  / __ \\___  ____ ___  (_)___  ____/ /__  _____
  / /_/ / _ \\/ ___/ _ \\/ __ \\/ __  /  / /_/ / _ \\/ __ \`__ \\/ / __ \\/ __  / _ \\/ ___/
 / _, _/  __(__  )  __/ / / / /_/ /  / _, _/  __/ / / / / / / / / / /_/ /  __/ /    
/_/ |_|\\___/____/\\___/_/ /_/\\__,_/  /_/ |_|\\___/_/ /_/ /_/_/_/ /_/\\__,_/\\___/_/     
                                                        
====================================================================================
How To Use: node reminder.js [Document ID]
====================================================================================
    `);
	return;
}

const documentId = argv[2];

client.connect(async (err) => {
	var query = { DocumentID: documentId };
	const collections = await new Promise((resolve, reject) => {
		client
			.db('DocumentDB')
			.listCollections()
			.toArray((err, info) => {
				resolve(info);
			});
	});

	const documents = await Promise.all(
		collections.map(
			(collection) =>
				new Promise(async (resolve) => {
					var count = await client
						.db('DocumentDB')
						.collection(collection.name)
						.findOne(query, (err, result) => {
							if (result) {
								resolve(result);
							} else {
								resolve(null);
							}
						});
				}),
		),
	);

	const document = documents.find((x) => x);

	if (!document)
		return console.log(
			`[Failed] Document with ID ${documentId} is not found!`,
		);

	if (
		['Completed', 'Void', 'Deleted', 'Draft'].indexOf(document.Status) ===
		-1
	) {
		console.log(`Document was found! Processing....`);

		document.Reciever = (document.Reciever || []).map((receiver, i) => ({
			...receiver,
			RecipientIndex: i,
		}));

		const recipients = [];

		if (document.SignOrder) {
			const nextRecipient = document.Reciever.find(
				(receiver) =>
					receiver.RecipientOption === 'Needs to Sign' &&
					receiver.RecipientStatus === 'Sent',
			);
			if (nextRecipient) {
				recipients.push(nextRecipient);
			}
		} else {
			const targets = document.Reciever.filter(
				(receiver) =>
					receiver.RecipientOption === 'Needs to Sign' &&
					receiver.RecipientStatus === 'Sent',
			);

			if (targets.length !== 0) {
				targets.forEach((target) => {
					recipients.push(target);
				});
			}
		}

		if (recipients.length === 0) {
			console.log(`[Error] No more recipients to sign the document!`);
		} else {
			recipients.forEach((recipient) => {
				SignReminderMail(document, recipient);
				console.log(
					`[Success] Mail reminder has been sent to ${
						recipient.RecipientEmail
					}`,
				);
			});
		}
	} else {
		return console.log(
			`[Failed] Document with ID ${documentId} is in ${
				document.Status
			} status!`,
		);
	}
});
