# P2P Payments App!
This is a simple illustration of a P2P network for payment users are able to carry out 2 primary functions

1. Add money to their account via Paystack
2. Send money to friends using thier pay tags

Before we get started with setup and the nitty-gritty of the app the live demo is available 👉🏼 [here](https://p2p-frontend-amber.vercel.app/)

This system was built using Node Js, TypeScript, and MongoDB and is deployed on [Vercel](https://vercel.com) (frontend) and [Render](https://render.com) (backend)

## Prerequisites

In order to run this project you must have Node JS installed, download it here 👉🏼 [node-js-download](https://nodejs.org/en)

## Installation

To get started clone this repo to your computer 

    $ git clone https://github.com/Alfred-Onuada/p2p-payments-system.git
   
   Once the repo is cloned go ahead and install the dependencies
   

    $ npm install

You are now ready to start the server, run

    $ npm run dev

## API Description

There are 3 major segments of the applications API

1. The Authentication / Authorization controller - to handle functions such as login / register / logout / token rotation
2. The user controller - to handle the retrieval of user information
3. The wallet controller - to handle wallet top-up and transfer of funds to other users


-  ### **Let's get started with Auth**

	**Registration**
	> POST - https://p2p-api.onrender.com/api/auth/register

	This route expects a payload of the format 

	```json
	{
		"firstName": "Harley",
		"lastName": "Quin",
		"email": "quin@dc.com",
		"password": "joker-me",
		"username": "Quinny"
	}
	```

	and will return a response in the format

	```json
	{

			"message":  "Registration successful",
			"data":  {
				"accessToken":  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDdiYmQzZTQwOGJjMzhjNjYwZjgwODQiLCJpYXQiOjE2ODU4MzA5NzUsImV4cCI6MTY4NTgzMTg3NX0.FppqYvKN_LjHKjd7GKfnmLbbMJgOgs4hF-X9yH9WwME",
				"refreshToken":  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDdiYmQzZTQwOGJjMzhjNjYwZjgwODQiLCJ0b2tlbklkIjoiNjQ3YmJkM2U0MDhiYzM4YzY2MGY4MDg2IiwiaWF0IjoxNjg1ODMwOTc1LCJleHAiOjE2ODY0MzU3NzV9.VDil1gimXiY9doxZyPsWlVUoN8EJeh2JUboA70SdAdA"
			}
	}
	```

	The API uses JWT based auth, as such returns both a refresh token and an access token to the client. The access tokens has a lifespan of 15 minutes while the refresh token has a lifespan of 7 days
	
	If there is a problem with the request a response of the following format will be returned

	```json
	{
		"message":  "username already exists"
	}
	```

	**Login**
	> POST - https://p2p-api.onrender.com/api/auth/login

	This route processes a login request and expects a payload like below
	```json
	{
		"email": "quin@dc.com",
		"password": "joker-me"
	}
	```

	and errors during login will return a response in similar format to the registration logic

	**Logout**
	> POST - https://p2p-api.onrender.com/api/auth/logout

	This route expects no payload except a `refresh token` in the authorization header in the bearer token style

	**Rotate tokens**
	> POST -  https://p2p-api.onrender.com/api/auth/rotate

This accepts a refresh token in the authorization headers, invalidates it and returns a new set of tokens to the client

-  ### **User controller**
	The user controller provides one route
	> GET -  https://p2p-api.onrender.com/api/user/info

	which returns information about the current signed-in user, in order to be classified as a signed-in user the request should contain the access token in the authorization headers.

	It returns a response like below

	```json
	{
		"message":  "Profile retrieved successfully",
		"data":  {
			"_id":  "647bbd3e408bc38c660f8084",
			"firstName":  "jennifer",
			"lastName":  "aniston",
			"username":  "@racheal",
			"email":  "racheal@friends.com",
			"walletBalance":  0
		}
	}
	```

-  ### **Wallet controller**

	**Transfer**
	> POST - https://p2p-api.onrender.com/api/wallet/transfer
	
	This accepts a couple of information in the body of the request and processes a transfer from one user to another returning errors as neccessary.
	e.g of the payload
	```json
	{
		"receiver": "@racheal",
		"amount": 5500,
		"note": "Happy Birthday"
	}
	```

	**Topup Verification**
	> POST - https://p2p-api.onrender.com/api/wallet/verify/:ref

	After payment is completed via the paystack frontend client, this route handles the callback by verifying the transaction using the paystack verification endpoint 👉🏼  https://api.paystack.co/transaction/verify/:ref with the transaction ref sent in the request parameters.
	Upon successful verification the money will be added to the user's account.


#

Thanks for getting this far 😁
