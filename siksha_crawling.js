// Generated by CoffeeScript 1.9.2
var app, combineCrawlingData, consignmentCrawling, crawlingJob, cronJob, directManagementCrawling, express, fs, getDataOfNextSunday, getTimeType, graduateCrawling, iconv, jqueryFile, jsdom, moment, promise, request, restaurantInfo, setPrice, writeCrawlingData;

jsdom = require("jsdom");

request = require("request");

iconv = require("iconv-lite");

promise = require("bluebird");

cronJob = require("cron").CronJob;

fs = require("fs");

moment = require("moment");

express = require("express");

app = express();

jqueryFile = fs.readFileSync("./jquery.js", "utf-8");

restaurantInfo = require("./restaurant_info.js");

setPrice = function(mark) {
  switch (mark) {
    case 'ⓐ':
      return "1700";
    case 'ⓑ':
    case "menu_a":
      return "2000";
    case 'ⓒ':
    case "menu_b":
      return "2500";
    case 'ⓓ':
    case "menu_c":
      return "3000";
    case 'ⓔ':
    case "menu_d":
      return "3500";
    case 'ⓕ':
    case "menu_e":
      return "4000";
    case 'ⓖ':
      return "4500";
    case 'ⓗ':
      return "Etc";
    default:
      return "Error";
  }
};

getTimeType = function(index) {
  if (index >= 0 && index < 2) {
    return "breakfast";
  } else if (index >= 2 && index < 5) {
    return "lunch";
  } else {
    return "dinner";
  }
};

getDataOfNextSunday = function(query, callback) {
  var options;
  options = {
    url: "http://dorm.snu.ac.kr/dk_board/facility/food.php?" + query,
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36"
    },
    encoding: null
  };
  return request(options, function(error, response, body) {
    if (!error) {
      return jsdom.env({
        html: iconv.decode(body, "UTF-8"),
        src: [jqueryFile],
        done: function(err, window) {
          var $, i, j, menu, menus, td, tr;
          $ = window.jQuery;
          menus = [];
          for (i = j = 0; j < 7; i = ++j) {
            tr = ($("tbody:first")).children().get(i);
            td = ($(tr)).find("td:not(td[rowspan], td[class=bg])").get(0);
            menu = ($(td)).text().trim();
            if (menu !== "") {
              menus.push({
                time: getTimeType(i),
                name: menu,
                price: setPrice(($(td)).find("li").attr("class"))
              });
            }
          }
          return callback(menus);
        }
      });
    }
  });
};

graduateCrawling = function(list, flag) {
  return new promise(function(resolve) {
    var options;
    options = {
      url: "http://dorm.snu.ac.kr/dk_board/facility/food.php",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36"
      },
      encoding: null
    };
    return request(options, function(error, response, body) {
      if (!error) {
        return jsdom.env({
          html: iconv.decode(body, "UTF-8"),
          src: [jqueryFile],
          done: function(err, window) {
            var $, i, j, menu, menus, query, td, todayIndex, tr;
            $ = window.jQuery;
            todayIndex = new Date().getDay();
            if (todayIndex === 6 && flag === "tomorrow") {
              query = ($("div.go")).find("a[class=right]").attr("href").substring(11).trim();
              return getDataOfNextSunday(query, function(data) {
                list.push({
                  restaurant: "대학원 기숙사 식당",
                  menus: data
                });
                return resolve(list);
              });
            } else {
              menus = [];
              for (i = j = 0; j <= 6; i = ++j) {
                tr = $("tbody:first").children().get(i);
                td = $(tr).find("td:not(td[rowspan], td[class=bg])").get((flag === "tomorrow" ? todayIndex + 1 : todayIndex));
                menu = $(td).text().trim();
                if (menu !== "") {
                  menus.push({
                    time: getTimeType(i),
                    name: menu,
                    price: setPrice($(td).find("li").attr("class"))
                  });
                }
              }
              list.push({
                restaurant: "대학원 기숙사 식당",
                menus: menus
              });
              return resolve(list);
            }
          }
        });
      }
    });
  });
};

directManagementCrawling = function(list, flag) {
  return new promise(function(resolve) {
    var query, today, tomorrow;
    today = new Date();
    tomorrow = new Date(today.valueOf() + (24 * 60 * 60 * 1000));
    query = flag === "today" ? "?date=" + (moment(today).format("YYYY-MM-DD")) : "?date=" + (moment(tomorrow).format("YYYY-MM-DD"));
    return request({
      url: "http://www.snuco.com/html/restaurant/restaurant_menu1.asp" + query,
      encoding: "binary"
    }, function(error, response, body) {
      if (!error) {
        return jsdom.env({
          html: iconv.decode(body, "euc-kr"),
          src: [jqueryFile],
          done: function(err, window) {
            var $, breakfast, breakfastTd, breakfasts, dinner, dinnerTd, dinners, j, k, l, len, len1, len2, len3, lunch, lunchTd, lunches, m, menu, menus, price, restaurant, restaurants, tr;
            restaurants = restaurantInfo.classMap.get("directManagement");
            $ = window.jQuery;
            for (j = 0, len = restaurants.length; j < len; j++) {
              restaurant = restaurants[j];
              tr = ($("table")).find("tr:contains(" + restaurant + ")");
              breakfastTd = tr.find("td:nth-child(3)").text().trim().replace(/\n| /gi, "/");
              lunchTd = tr.find("td:nth-child(5)").text().trim().replace(/\n| /gi, "/");
              dinnerTd = tr.find("td:nth-child(7)").text().trim().replace(/\n| /gi, "/");
              breakfasts = breakfastTd.split("/");
              lunches = lunchTd.split("/");
              dinners = dinnerTd.split("/");
              menus = [];
              for (k = 0, len1 = breakfasts.length; k < len1; k++) {
                breakfast = breakfasts[k];
                menu = breakfast.substring(1);
                price = setPrice(breakfast.charAt(0));
                if (!(menu === "" || price === "Error")) {
                  menus.push({
                    time: "breakfast",
                    name: menu,
                    price: price
                  });
                }
              }
              for (l = 0, len2 = lunches.length; l < len2; l++) {
                lunch = lunches[l];
                menu = lunch.substring(1);
                price = setPrice(lunch.charAt(0));
                if (!(menu === "" || price === "Error")) {
                  menus.push({
                    time: "lunch",
                    name: menu,
                    price: price
                  });
                }
              }
              for (m = 0, len3 = dinners.length; m < len3; m++) {
                dinner = dinners[m];
                menu = dinner.substring(1);
                price = setPrice(dinner.charAt(0));
                if (!(menu === "" || price === "Error")) {
                  menus.push({
                    time: "dinner",
                    name: menu,
                    price: price
                  });
                }
              }
              list.push({
                restaurant: restaurantInfo.nameMap.get(restaurant),
                menus: menus
              });
            }
            return resolve(list);
          }
        });
      }
    });
  });
};

consignmentCrawling = function(list, flag) {
  return new promise(function(resolve) {
    var query, today, tomorrow;
    today = new Date();
    tomorrow = new Date(today.valueOf() + (24 * 60 * 60 * 1000));
    query = flag === "today" ? "?date=" + (moment(today).format("YYYY-MM-DD")) : "?date=" + (moment(tomorrow).format("YYYY-MM-DD"));
    return request({
      url: "http://www.snuco.com/html/restaurant/restaurant_menu2.asp" + query,
      encoding: "binary"
    }, function(error, response, body) {
      if (!error) {
        return jsdom.env({
          html: iconv.decode(body, "euc-kr"),
          src: [jqueryFile],
          done: function(err, window) {
            var $, breakfast, breakfastTd, breakfasts, dinner, dinnerTd, dinners, j, k, l, len, len1, len2, len3, lunch, lunchTd, lunches, m, menu, menus, price, restaurant, restaurants, tr;
            restaurants = restaurantInfo.classMap.get("consignment");
            $ = window.jQuery;
            for (j = 0, len = restaurants.length; j < len; j++) {
              restaurant = restaurants[j];
              tr = ($("table")).find("tr:contains(" + restaurant + ")");
              breakfastTd = tr.find("td:nth-child(3)").text().trim().replace(/\n| /gi, "/");
              lunchTd = tr.find("td:nth-child(5)").text().trim().replace(/\n| /gi, "/");
              dinnerTd = tr.find("td:nth-child(7)").text().trim().replace(/\n| /gi, "/");
              breakfasts = breakfastTd.split("/");
              lunches = lunchTd.split("/");
              dinners = dinnerTd.split("/");
              menus = [];
              for (k = 0, len1 = breakfasts.length; k < len1; k++) {
                breakfast = breakfasts[k];
                menu = breakfast.substring(1);
                price = setPrice(breakfast.charAt(0));
                if (!(menu === "" || price === "Error")) {
                  menus.push({
                    time: "breakfast",
                    name: menu,
                    price: price
                  });
                }
              }
              for (l = 0, len2 = lunches.length; l < len2; l++) {
                lunch = lunches[l];
                menu = lunch.substring(1);
                price = setPrice(lunch.charAt(0));
                if (!(menu === "" || price === "Error")) {
                  menus.push({
                    time: "lunch",
                    name: menu,
                    price: price
                  });
                }
              }
              for (m = 0, len3 = dinners.length; m < len3; m++) {
                dinner = dinners[m];
                menu = dinner.substring(1);
                price = setPrice(dinner.charAt(0));
                if (!(menu === "" || price === "Error")) {
                  menus.push({
                    time: "dinner",
                    name: menu,
                    price: price
                  });
                }
              }
              list.push({
                restaurant: restaurantInfo.nameMap.get(restaurant),
                menus: menus
              });
            }
            return resolve(list);
          }
        });
      }
    });
  });
};

combineCrawlingData = function(flag, callback) {
  var consignments, directManagements, graduates, result;
  result = [];
  directManagements = [];
  consignments = [];
  graduates = [];
  return promise.all([directManagementCrawling(directManagements, flag), consignmentCrawling(consignments, flag), graduateCrawling(graduates, flag)]).then(function() {
    var j, k, l, len, len1, len2, restaurant;
    for (j = 0, len = directManagements.length; j < len; j++) {
      restaurant = directManagements[j];
      result.push(restaurant);
    }
    for (k = 0, len1 = consignments.length; k < len1; k++) {
      restaurant = consignments[k];
      result.push(restaurant);
    }
    for (l = 0, len2 = graduates.length; l < len2; l++) {
      restaurant = graduates[l];
      result.push(restaurant);
    }
    return callback(result);
  });
};

writeCrawlingData = function() {
  combineCrawlingData("today", function(data) {
    return fs.writeFile("./restaurants_today.json", JSON.stringify(data), function(err) {
      if (err) {
        return console.log("Error occurs when writing today json!");
      }
    });
  });
  return combineCrawlingData("tomorrow", function(data) {
    return fs.writeFile("./restaurants_tomorrow.json", JSON.stringify(data), function(err) {
      if (err) {
        return console.log("Error occurs when writing tomorrow json!");
      }
    });
  });
};

crawlingJob = new cronJob("00 02 00 * * *", writeCrawlingData(), null, true, "Asia/Seoul");

app.get("/restaurants", function(req, res) {
  var date_str;
  date_str = req.query.date;
  if (date_str === "today") {
    return fs.readFile("./restaurants_today.json", {
      encoding: "utf8"
    }, function(err, cachedData) {
      if (!err) {
        return res.send(cachedData);
      } else {
        return combineCrawlingData("today", function(newData) {
          return res.send(newData);
        });
      }
    });
  } else if (date_str === "tomorrow") {
    return fs.readFile("./restaurants_tomorrow.json", {
      encoding: "utf8"
    }, function(err, cachedData) {
      if (!err) {
        return res.send(cachedData);
      } else {
        return combineCrawlingData("tomorrow", function(newData) {
          return res.send(newData);
        });
      }
    });
  } else {
    return combineCrawlingData("today", function(newData) {
      return res.send(newData);
    });
  }
});

app.listen("3280");
