var jsdom = require('jsdom');
var request = require('request');
var iconv = require('iconv-lite');
var express = require('express');
var app = express();

var restaurantList = require('./restaurant_info.js');
var routesMap = restaurantList.routesMap;

var jikyoungOptions = {
	url : 'http://www.snuco.com/html/restaurant/restaurant_menu1.asp',
	headers : { 
		'User-Agent' : 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
	},
	encoding : "binary"
};

var junjikyoungOptions = {
	url : 'http://www.snuco.com/html/restaurant/restaurant_menu2.asp',
	headers : { 
		'User-Agent' : 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
	},
	encoding : "binary"
};

var graduateOptions = {
	url : 'http://dorm.snu.ac.kr/dk_board/facility/food.php',
	headers : { 
		'User-Agent' : 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
	},
	encoding : null
};

function setPrice(mark) {
	var price;

	switch (mark) {
		case 'ⓐ' :
			price = 1700;
			break;
		case 'ⓑ' :
		case 'menu_a' :
			price = 2000;
			break;
		case 'ⓒ' :
		case 'menu_b' :
			price = 2500;
			break;
		case 'ⓓ' :
		case 'menu_c' :
			price = 3000;
			break;
		case 'ⓔ' :
		case 'menu_d' :
			price = 3500;
			break;
		case 'ⓕ' :
		case 'menu_e' :
			price = 4000;
			break;
		case 'ⓖ' :
			price = 4500;
			break;
		case 'ⓗ' :
			price = 0;
			break;
	}

	return price;
}

function getOptions(flag) {
	var options;

	switch (flag) {
		case 0 :
			options = jikyoungOptions;
			break;
		case 1 :
			options = junjikyoungOptions;
			break;
		case 2 :
		  options = graduateOptions;
		  break;
	}

	return options;
}

function getTimeTypeFromGraduate(index) {
	if (index >= 0 && index < 2)
		return "breakfast";
	else if (index >= 2 && index < 5)
		return "lunch";
	else
		return "dinner";
}

function requestGraduateCrawling(req, res, flag) {
	var options = getOptions(flag);
	
	var date = new Date();
	var week = new Array('일', '월', '화', '수', '목', '금', '토');
	var today = date.getDay();

	request(getOptions(flag), function(error, response, body) {
		if (!error) {
			var decodedBody = iconv.decode(body, "UTF-8");
			
			jsdom.env({
				html : decodedBody,
				scripts : ['http://code.jquery.com/jquery-2.1.3.min.js'],
				done : function(err, window) {
					var jsonArray = [];
					var key = req.route.path;

					var $ = window.jQuery;
					var tbody = $('tbody').first().children();
			
					for(var i = 0; i < 7; i++) {
						var tr = tbody.get(i);
						var td = $(tr).find('td:not(td[rowspan], td[class=bg])').get(today);

						jsonArray.push({
							name : $(td).text().trim() == "" ? null : $(td).text().trim(),
							price : $(td).text().trim() == "" ? 0 : setPrice($(td).find('li').attr('class')),
							time : getTimeTypeFromGraduate(i)
						});
					}

					res.send({ restaurant : routesMap.get(key), menus : jsonArray });
				}
			});
		}
	});
}

function requestCrawling(req, res, flag) {
	var options = getOptions(flag);

	request(options, function(error, response, body) {
		if (!error) {
			var decodedBody = iconv.decode(body, "euc-kr");
				
			jsdom.env({
				html : decodedBody,
				scripts : ['http://code.jquery.com/jquery-2.1.3.min.js'],
				done : function(err, window) {
					var restaurantJsons = [];
					var key = req.route.path;
					var restaurants = routesMap.get(key);

					var $ = window.jQuery;
					var page = $('table');

					for(var index in restaurants) {
						var menuJsons = [];

						var tr = page.find("tr:contains(" + restaurants[index] + ")");
        		var breakfastTd = tr.find("td:nth-child(3)").text().trim().replace(/\n| /gi, "");
          	var lunchTd = tr.find("td:nth-child(5)").text().trim().replace(/\n| /gi, "");
         	 	var dinnerTd = tr.find("td:nth-child(7)").text().trim().replace(/\n| /gi, "");

          	var breakfasts = breakfastTd.split("/");
          	var lunches = lunchTd.split("/");
          	var dinners = dinnerTd.split("/");

          	for(var i in breakfasts) {
							menuJsons.push({
								time : "breakfast",
								name : breakfasts[i].substring(1) == "" ? null : breakfasts[i].substring(1),
								price : breakfasts[i].substring(1) == "" ? 0 : setPrice(breakfasts[i].charAt(0))
							});
						}
						for(var i in lunches) {
							menuJsons.push({
								time : "lunch",
								name : lunches[i].substring(1) == "" ? null : lunches[i].substring(1),
								price : lunches[i].substring(1) == "" ? 0 : setPrice(lunches[i].charAt(0))
							});
						}
						for(var i in dinners) {
							menuJsons.push({
								time : "dinner",
								name : dinners[i].substring(1) == "" ? null : dinners[i].substring(1),
								price : dinners[i].substring(1) == "" ? 0 : setPrice(dinners[i].charAt(0))
							});
						}

						restaurantJsons.push({
							restaurant : restaurants[index],
							menus : menuJsons
						});
					}

					res.send(restaurantJsons);
				}
			});
		}
	});
}

app.get('/jikyoung', function(req, res) {
	requestCrawling(req, res, 0);
});

app.get('/junjikyoung', function(req, res) {
	requestCrawling(req, res, 1);
});

app.get('/graduate', function(req, res) {
	requestGraduateCrawling(req, res, 2);
});

app.listen("3000");
