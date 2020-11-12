// 用rhit.getDeals() 可以拿到10个打折游戏 但目前不知道是怎么选的
// rhit.get64bitId会自动拿到用户总游戏时长，用户名称和用户游戏库存
var rhit = rhit || {};
// const appid = require("appid");


//From: stackoverflow
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}


rhit.get64BitId = function (username) {
	const proxyurl = "https://cors-anywhere.herokuapp.com/";
	const endpoint = `http://steamcommunity.com/id/${username}?xml=1`;
	const url = proxyurl + endpoint;
	console.log(endpoint);
	const xhr = new XMLHttpRequest();
	xhr.addEventListener("load", rhit.idConversionHandler);
	xhr.responseType = "document";
	xhr.open("GET", url);
	xhr.send();
}

rhit.idConversionHandler = function () {
	if (this.status == 200) {
		console.log(this);
		const idWithTag = this.response.getElementsByTagName("steamID64")[0];
		const idTextNode = idWithTag.childNodes[0];
		const id = idTextNode.nodeValue;
		console.log(id);
		rhit.getPlayerInfo(id);
		rhit.getPlayerLib(id);
	}
}

rhit.getPlayerInfo = function (username) {
	const proxyurl = "https://cors-anywhere.herokuapp.com/";
	const endpoint = "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/";
	const apiKey = "274B2900E2413D518D70BC0FC6C979F3";
	const queryString = `?key=${apiKey}&steamids=${username}`;
	const url = endpoint + queryString;
	console.log(url);
	const url2 = proxyurl + url;

	var xhr = new XMLHttpRequest();
	xhr.addEventListener("load", rhit.playerResponseHandler);
	xhr.responseType = "json";
	xhr.open("GET", url2);
	xhr.send();
}

rhit.playerResponseHandler = function () {
	if (this.status == 200) {
		console.log("Good");
		console.log("UserPersonaname: " + this.response.response.players[0].personaname);
	}
}

rhit.getPlayerLib = function (username) {
	const proxyurl = "https://cors-anywhere.herokuapp.com/";
	const apiKey = "274B2900E2413D518D70BC0FC6C979F3";
	const url = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${username}&format=json`;
	const url2 = proxyurl + url;
	var xhr = new XMLHttpRequest();
	xhr.addEventListener("load", rhit.playerLibHandler);
	xhr.responseType = "json";
	xhr.open("GET", url2);
	xhr.send();
}

rhit.playerLibHandler = function () {
	if (this.status == 200) {
		console.log("PlayerLib Good");
		let appIdsString = "";
		let playTimeTotal = 0;
		const gameArr = this.response.response.games;
		for (i = 0; i < gameArr.length; i++) {
			// appIds.push(`app/${gameArr[i].appid}`);
			// appIds.push(`sub/${gameArr[i].appId}`);
			appIdsString = appIdsString.concat(`app/${gameArr[i].appid},`);
			playTimeTotal = playTimeTotal + gameArr[i].playtime_forever;
		}
		console.log(`Total playtime: ${playTimeTotal / 60}h`);
		appIdsString = appIdsString.substring(0, appIdsString.length - 1);
		rhit.convertAppIdToName(appIdsString);
	}
}


rhit.convertAppIdToName = function (appIdsString) {
	const proxyurl = "https://cors-anywhere.herokuapp.com/";
	const apiKey = "954b60b5fba629274ca717b3fbc5eafba5de26bd";
	const url = `https://api.isthereanydeal.com/v01/game/plain/id/?key=${apiKey}&shop=steam&ids=${appIdsString}`;
	const url2 = proxyurl + url;
	var xhr = new XMLHttpRequest();
	xhr.addEventListener("load", rhit.appIdConversionHandler);
	xhr.responseType = "json";
	xhr.open("GET", url2);
	xhr.send();
}

rhit.appIdConversionHandler = function () {
	if (this.status == 200) {
		console.log("appIdConversion Good");
		let gameNameArr = [];
		for (var key in this.response.data) {
			let gameName = this.response.data[key];
			if (gameName != null) {
				gameNameArr.push(gameName);
			}
		}
		console.log(gameNameArr);
		// 这里拿到的是游戏的plain，不是游戏名 需要更新
		const newList = htmlToElement('<div id="gameListContainer"></div>');
		for(let i = 0; i< gameNameArr.length; i++){
			const newCard = rhit.createCardTitleOnly(gameNameArr[i]);
			newList.appendChild(newCard);
		}
		const oldList = document.querySelector("#gameLibTitle");
			// oldList.removeAttribute("id");
			oldList.hidden = true;
			oldList.parentElement.appendChild(newList);
	}
}

rhit.getHotGame = function () {
	const proxyurl = "https://cors-anywhere.herokuapp.com/";
	const url = "steamspy.com/api.php?request=top100in2weeks";
	const url2 = proxyurl + url;
	var xhr = new XMLHttpRequest();
	xhr.addEventListener("load", rhit.hotGameHandler);
	xhr.responseType = "json";
	xhr.open("GET", url2);
	xhr.send();
}

rhit.hotGameHandler = function () {

}

rhit.searchGames = function (term) {
	const apiKey = "954b60b5fba629274ca717b3fbc5eafba5de26bd";
	const proxyurl = "https://cors-anywhere.herokuapp.com/";
	const url = `https://api.isthereanydeal.com/v02/search/search/?key=${apiKey}&q=${term}&limit=20&strict=0`;
	const url2 = proxyurl + url;
	var xhr = new XMLHttpRequest();
	xhr.addEventListener("load", rhit.searchHandler);
	xhr.responseType = "json";
	xhr.open("GET", url2);
	xhr.send();
}

rhit.searchHandler = function () {
	if (this.status == 200) {
		console.log("Search success");
		const result = this.response.data.results;
		const newList = htmlToElement('<div id="gameListContainer"></div>');
		for (let i = 0; i < result.length; i++) {
			console.log(`${result[i].title}`);
			// 用result[i].plain来拿到一个游戏的plain，然后用plain来拿到价格，存愿望单的话把plain和title都扔进去方便之后调用
			const newCard = rhit.createCardTitleOnly(result[i].title);
			newList.appendChild(newCard);
		}
		const oldList = document.querySelector("#searchResult");
			// oldList.removeAttribute("id");
			oldList.hidden = true;
			oldList.parentElement.appendChild(newList);
	}
}

rhit.getGamePrice = function (plain) {
	const apiKey = "954b60b5fba629274ca717b3fbc5eafba5de26bd";
	const proxyurl = "https://cors-anywhere.herokuapp.com/";
	const url = `https://api.isthereanydeal.com/v01/game/prices/?key=${apiKey}&plains=${plain}&region=us&country=US&shops=steam%2Cgog&exclude=voidu%2Citchio&added=0`;
	const url2 = proxyurl + url;
	var xhr = new XMLHttpRequest();
	xhr.addEventListener("load", (event) => {
		console.log("aaa");
		console.log(event.target);
		console.log(plain);
		if (event.target.status == 200) {
			console.log("Price success");
			const result = event.target.response.data[plain].list;
			for (let i = 0; i < result.length; i++) {
				console.log(`store: ${result[i].shop.name}. Current Price: ${result[i].price_new}. Original Price: ${result[i].price_old}`);
			}
		}
	});
	xhr.responseType = "json";
	xhr.open("GET", url2);
	xhr.send();
}

rhit.getDeals = function () {
	const apiKey = "954b60b5fba629274ca717b3fbc5eafba5de26bd";
	const proxyurl = "https://cors-anywhere.herokuapp.com/";
	const url = `https://api.isthereanydeal.com/v01/deals/list/?key=${apiKey}&offset=0&limit=10&region=us&country=US&shops=steam`
	const url2 = proxyurl + url;
	let outputList = [];
	var xhr = new XMLHttpRequest();
	xhr.addEventListener("load", (event) => {
		if (event.target.status == 200) {
			console.log("deal good");
			const result = event.target.response.data.list;
			const newList = htmlToElement('<div id="gameListContainer"></div>');
			for (let i = 0; i < result.length; i++) {
				// console.log(`Title: ${result[i].title} Current Price: ${result[i].price_new} Original Price: ${result[i].price_old} ${result[i].price_cut}% off`);
				// 这里还是用result[i].plain来抓plain
				// outputList.push(result[i].title);
				// console.log(outputList);
				const newCard = rhit.createCard(result[i].title, result[i].price_new, result[i].price_cut);
				newList.appendChild(newCard);
			}
			const oldList = document.querySelector("#saleTitle");
			oldList.removeAttribute("id");
			oldList.hidden = true;
			oldList.parentElement.appendChild(newList);
		}
	});
	xhr.responseType = "json";
	xhr.open("GET", url2);
	xhr.send();
	// console.log("Outlist: ",outputList.toString());
	// return outputList;
}

rhit.dealHandler = function () {

	return outputList;

}

rhit.getImageForGame = function (appId) {
	const url = `http://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
	return url;
}


rhit.createCard = function (gameName, gamePrice, discount) {
	return htmlToElement(`<div class="card">
	<img class="card-img-left" src="..." alt="Card image cap">
	<div class="card-body">
	  <p class="card-text">${gameName}&nbsp&nbsp&nbspPrice:&nbsp${gamePrice}&nbsp&nbsp&nbspDiscount:&nbsp${discount}%&nbspOFF!</p>
	</div>
  </div>`);
}

rhit.createCardTitleOnly = function (gameName) {
	return htmlToElement(`<div class="card">
	<img class="card-img-left" src="..." alt="Card image cap">
	<div class="card-body">
	  <p class="card-text">${gameName}</p>
	</div>
  </div>`);
}

rhit.SalePageController = class {
	constructor() {
		this.updateView();
	}


	updateView() {
		console.log("Update List");
		// const newList = htmlToElement('<div id="gameListContainer"></div>');
		//Fill it with quote cards
		// const result = rhit.getDeals();
		// console.log("OutputList: ",result.toString());
		// for (let i = 0; i < result.length; i++) {
		// 	const newCard = this._createCard(result[i].title);
		// 	newList.appendChild(newCard);
		// }
		rhit.getDeals();

		//remove old container and put in new one
		// const oldList = document.querySelector("#saleTitle");
		// oldList.removeAttribute("id");
		// oldList.hidden = true;
		// oldList.parentElement.appendChild(newList);
	}
}

rhit.ProfilePageController = class {
	constructor() {
		this.updateView();
	}

	updateView() {
		console.log("Update Profile");
		document.querySelector("#profileEmail").innerHTML = "Email: " + rhit.fbAuthManager.email;
		document.querySelector("#profileUsername").innerHTML = "Username: " + rhit.fbAuthManager.username;
		console.log(rhit.fbAuthManager.email);
	}
}

rhit.SearchPageController = class {
	constructor(){
		
		this.updateView();
	}

	updateView(){
		console.log("You are on search Page");
		document.querySelector("#searchButton").onclick = (event)=>{
			const inputGameName = document.querySelector("#gameTitleInput").value;
			rhit.searchGames(inputGameName);
		}
		
	}
}

rhit.GameLibPageController = class {
	constructor(){
		this.updateView();
	}

	updateView(){
		if(!rhit.fbAuthManager.isSignedIn){
			document.querySelector("#gameLibTitle").innerHTML = "You are not signed in!";
		}else{
			rhit.get64BitId(895713836);
		}
	}
}

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			// var displayName = user.displayName;
			// var email = user.email;
			// var photoURL = user.photoURL;
			// const phoneNumber = user.phoneNumber;
			// var isAnonymous = user.isAnonymous;
			// var uid = user.uid;

			// console.log("The use is signed in ", uid);
			// console.log('displayName :>> ', displayName);
			// console.log('email :>> ', email);
			// console.log('photoURL :>> ', photoURL);
			// console.log('phoneNumber :>> ', phoneNumber);
			// console.log('isAnonymous :>> ', isAnonymous)
			this._user = user;
			changeListener();
			//const uid = this._user.uid;
			const inputEmailEl = document.querySelector("#inputEmail");
			const inputPasswordEl = document.querySelector("#inputPassword");
		});
	}

	signOut() {
		firebase.auth().signOut().catch(function (error) {
			console.log("sign out error");
		});
	}
	get isSignedIn() {
		return !!this._user;
	}
	get uid() {
		return this._user.uid;
	}

	get email() {
		return this._user.email;
	}

	get username() {
		return this._user.displayName;
	}

	get photo() {
		return this._user.photoURL;
	}
}

rhit.initializePage = function () {
	if (document.querySelector("#salePage")) {
		console.log("You are on the sale page");
		new rhit.SalePageController();
	}

	if (document.querySelector("#profilePage")) {
		console.log("You are on the profile page");
		new rhit.ProfilePageController();
	}

	if (document.querySelector("#searchPage")) {
		console.log("You are on the search page");
		new rhit.SearchPageController();
	}

	if (document.querySelector("#gameLibPage")) {
		console.log("You are on the gameLib page");
		new rhit.GameLibPageController();
	}

	if (document.querySelector("#loginPage")) {
		console.log("You are on the login page");
	}

	if (document.querySelector("#createAccountButton") != null) {
		document.querySelector("#createAccountButton").onclick = (event) => {
			const inputEmailEl = document.querySelector("#inputEmail");
			const inputPasswordEl = document.querySelector("#inputPassword");
			console.log(`Create account for email: ${inputEmailEl.value} password: ${inputPasswordEl.value}`);

			firebase.auth().createUserWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value).catch(function (error) {

				var errorCode = error.code;
				var errorMessage = error.message;
				console.log("Create Error", errorCode, errorMessage);
			});
		};

	}
	if (document.querySelector("#logInButton") != null) {
		document.querySelector("#logInButton").onclick = (event) => {
			const inputEmailEl = document.querySelector("#inputEmail");
			const inputPasswordEl = document.querySelector("#inputPassword");
			console.log(`Log in for email: ${inputEmailEl.value} password: ${inputPasswordEl.value}`);

			firebase.auth().signInWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value).catch(function (error) {

				var errorCode = error.code;
				var errorMessage = error.message;
				console.log("Log in Error", errorCode, errorMessage);
			});
		};

	}
	if (document.querySelector("#newAccountButton") != null) {
		document.querySelector("#newAccountButton").onclick = (event) => {
			window.location.href = `/register.html`;
		}
	}

	if (document.querySelector("#logInJumpButton") != null) {
		document.querySelector("#logInJumpButton").onclick = (event) => {
			window.location.href = "/";
		}
	}

	if (document.querySelector("#steamLoginBar") != null) {
		document.querySelector("#steamLoginBar").onclick = (event) => {
			window.location.href = `/steamLogin.html`;
		}
	}

	if (document.querySelector("#userLoginBar") != null) {
		document.querySelector("#userLoginBar").onclick = (event) => {
			window.location.href = "/";
		}
	}

	if (document.querySelector("#searchBar") != null) {
		document.querySelector("#searchBar").onclick = (event) => {
			window.location.href = `/searchPage.html`;
		}
	}

	if (document.querySelector("#saleBar") != null) {
		document.querySelector("#saleBar").onclick = (event) => {
			window.location.href = `/salePage.html`;
		}
	}

	if (document.querySelector("#gameLibBar") != null) {
		document.querySelector("#gameLibBar").onclick = (event) => {
			window.location.href = `/gameLibPage.html`;
		}
	}
}

rhit.checkForRedirects = function () {
	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/profilePage.html";
	}
	if (document.querySelector("#gameLibPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/";
	}
};

rhit.main = function () {
	console.log("Ready");

	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("auth change callback fired");
		console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);
		rhit.checkForRedirects();
		rhit.initializePage();
	});

	// document.querySelector("#signOutButton").onclick = (event) => {
	// 	console.log("Sign Out");

	// 	firebase.auth().signOut().then(function() {
	// 		console.log("Signed out!");
	// 	  }).catch(function(error) {
	// 		console.log("Signed out error!");
	// 	  });
	// };


}
rhit.main();


// {
// 	"response": {
// 		"players": [{
// 			"steamid": "76561197960435530",
// 			"communityvisibilitystate": 3,
// 			"profilestate": 1,
// 			"personaname": "Robin",
// 			"profileurl": "https://steamcommunity.com/id/robinwalker/",
// 			"avatar": "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/f1/f1dd60a188883caf82d0cbfccfe6aba0af1732d4.jpg",
// 			"avatarmedium": "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/f1/f1dd60a188883caf82d0cbfccfe6aba0af1732d4_medium.jpg",
// 			"avatarfull": "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/f1/f1dd60a188883caf82d0cbfccfe6aba0af1732d4_full.jpg",
// 			"avatarhash": "f1dd60a188883caf82d0cbfccfe6aba0af1732d4",
// 			"personastate": 3,
// 			"realname": "Robin Walker",
// 			"primaryclanid": "103582791429521412",
// 			"timecreated": 1063407589,
// 			"personastateflags": 0,
// 			"loccountrycode": "US",
// 			"locstatecode": "WA",
// 			"loccityid": 3961
// 		}]
// 	}
// }