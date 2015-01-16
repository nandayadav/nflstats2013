var margin = {top: 40, right: 130, bottom: 40, left: 60},
    width = 1040 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1);

var y = d3.scale.linear()
    .rangeRound([height, 0]);

var color = d3.scale.ordinal()
    .range(["#75D1BD", "#C65360"]);

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
var dimension = "points",
      viewType = "team",
      xGrouping = "division",
      viewButton = "Offense - Defense";
      
      
var tip = d3.tip().attr('class', 'd3-tip').html(function(d) { 
  return d.Tm + "<br/><span class='indicator'>" + "Offense " + dimension + ": </span>" + d.dimensions[0].value 
           + rankDisplay(d.offenseRank) + "<br/><span class='indicator'>" 
           + "Defense " + dimension + ": </span>" + d.dimensions[1].value + rankDisplay(d.defenseRank); 
});
      
var playoffTeams = ["Baltimore Ravens", "Pittsburgh Steelers", "Denver Broncos", "Cincinnati Bengals",
                              "Carolina Panthers", "Dallas Cowboys", "Detroit Lions", "Arizona Cardinals" 
                             ];
var topFour = ["New England Patriots", "Indianapolis Colts", "Green Bay Packers", "Seattle Seahawks"];
var bottomFive = ["Tampa Bay Buccaneers", "Jacksonville Jaguars", "Washington Redskins", "Tennessee Titans", "Oakland Raiders"];
var teams, team;
var dimensionMappings = {yards: ["Yards", "DefenseYds"], plays: ["Plays", "DefensePlays"], yards_play: ["YdsPlay", "DefenseYdsPlay"], turnovers: ["TO", "DefenseTO"],
                                        points: ["Points", "DefensePts"], passing_yards: ["PassingYds", "DefPassingYds"], rushing_yards: ["RushingYds", "DefRushingYds"],
                                        touchdowns: ["Touchdowns", "DefTouchdowns"], fumbles: ["FL", "DefenseFR"], interceptions: ["Int", "DefPassingInt"],
                                        passing_attempts: ["PassingAtt", "DefPassingAtt"], passing_yds_attempt: ["PassingYdsAtt", "DefPassingYdsAtt"], 
                                        passing_tds: ["PassingTD", "DefPassingTD"], rushing_attempts: ["RushingAtt", "DefRushingAtt"], 
                                        rushing_yds_attempt: ["RushingYdsAtt", "DefRushingYdsAtt"], rushing_tds: ["RushingTD", "DefRushingTD"]
                                       };
var defensiveDimensions = ["turnovers", "fumbles", "interceptions"];
d3.csv("csv/nfl_2014_combined.csv", function(error, data) {
  
  var keys = d3.keys(data[0]).filter(function(key) { return key != 'Tm'; });
  data.forEach(function(d) {
    keys.forEach(function(key) {
      d[key] = d[key].indexOf(".") == -1 ? parseInt(d[key]) : parseFloat(d[key]);
      
      //Added attributes
      d.Touchdowns = d.RushingTD + d.PassingTD;
      d.DefTouchdowns = d.DefRushingTD + d.DefPassingTD;
      d.playoff = _.contains(playoffTeams, d.Tm);
      d.bottomFive = _.contains(bottomFive, d.Tm);
      d.topFour = _.contains(topFour, d.Tm);
    });
  });
  

  teams = data.slice(0, 32);
  
  averages = data[32];
  stdDeviations = data[33];
  
  teams.sort(function(a, b) { return d3.ascending(a.Position, b.Position); });
  
  color.domain(d3.keys(teams[0]).filter(function(key) { return _.contains(pair(), key); }));

  x.domain(teams.map(function(d) { return d.Tm; }));
  createDimensions();
  assignRanks();
  showDetails();
    
  var legend = svg.selectAll(".legend")
      .data([{name: "Final Four", color: "#43BB3E"}, {name: "Playoff Teams", color: "#75D1BD"}, {name: "Bottom 5", color: "#C65360"}, {name: "Others", color: "Gray"}])
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d) { return "translate(850)"; })
  
  legend.append("rect")
      .attr("width", 20)
      .attr("height", 20)
      .attr("y", function(d, i) { return i*30; })
      .style("fill", function(d) { return d.color; });
      
  legend.append("text")
      .attr("y", function(d, i) { return 14 + i*30; })
      .attr("x", 25)
      .text(function(d) { return d.name; })
      
  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("id", "yLabel")
      .attr("transform", "translate(-40," + (height/2 + 30)+ ")" + "rotate(-90)")
      .text(yLabel);

  team = svg.selectAll(".team")
      .data(teams)
    .enter().append("g")
      .attr("class", "team")
      .attr("transform", function(d) { return "translate(" + x(d.Tm) + ",0)"; })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);
      
  team.call(tip);
  
  team.append("rect")
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(Math.max(0, d.difference)); })
      .attr("height", function(d) { return Math.abs(y(d.difference) - y(0)); })
      .style("fill", fill);
      
      
  team.append("image")
      .attr("class", "teamLogo")
      .attr("xlink:href", teamLogoHref)
      .attr("transform", imageTransform)
      .attr("width", 25)
      .attr("height", 25);
});

function fill(d) {
  if (d.topFour) 
    return "#43BB3E";
  if (d.playoff)
    return "#75D1BD";
  else if (d.bottomFive)
    return "#C65360"; 
  else
    return "gray";
}

function pair() {
  return dimensionMappings[dimension];
}

function assignRanks() {
  ["offenseRank", "defenseRank"].forEach(function(rank, i) {
    var attr = pair()[i];
    teams.sort(function(a, b) { 
      if (_.contains(defensiveDimensions, dimension))
        return i == 0 ? d3.ascending(a[attr], b[attr]) : d3.descending(a[attr], b[attr]); 
      else
        return i == 0 ? d3.descending(a[attr], b[attr]) : d3.ascending(a[attr], b[attr]); 
    });
    teams.forEach(function(team, r) {
      team[rank] = r + 1;
    })
  })
}

function imageTransform(d) {
  return d.difference > 0 ? "translate(0, " + (y(d.difference) - 25) + ")" : "translate(0, " + (y(d.difference) + 4) + ")";
}

function yLabel(d) {
  return capitalizeString(dimension) + " Differential";
}

function rankDisplay(rank) {
  css = rank > 27 ? "\"badge danger\"" : "\"badge success\""
  return "&nbsp;<span class=" + css + ">" + rank + "</span>";
}

//Not used
function stdDeviationY(d) {
  var index = viewType === 'offense' ? 0 : 1
  return averages[pair()[index]] + d*stdDeviations[pair()[index]];
}

function teamLogoHref(d) {
  var names = d.Tm.split(" ");
  var name = _.last(names).toLowerCase(); 
  return "logos/" + name + ".gif";
}

//Save average difference(i.e, Offensive dimension - League Average)
function createDimensions() {
  teams.forEach(function(d) {
    d.dimensions = color.domain().map(function(name) { return {name: name, value: d[name]}; });
    if (viewType === 'team') {
      d.difference = d.dimensions[0].value - d.dimensions[1].value;
    } else if (viewType === 'offense') {
      d.difference = d.dimensions[0].value - averages[pair()[0]];
    } else { //defense
      d.difference = d.dimensions[1].value - averages[pair()[1]];
    }
  });
  
  y.domain(d3.extent(teams.map(function(d) { return d.difference; })));
}

//Redraw with transitions
function redraw() {  
  showDetails();
  var pair = dimensionMappings[dimension];
  color.domain(d3.keys(teams[0]).filter(function(key) { return _.contains(pair, key); }));
  
  createDimensions();
  assignRanks();
  
  var t1 = svg.transition().duration(1000);

  if (xGrouping === 'rank') {
    var sorted = teams;
    var t2 = t1.transition().duration(1000);
    sortByRank(sorted);

    x.domain(sorted.map(function(d) { return d.Tm; }));
    t2.selectAll(".team").attr("transform", function(d) { return "translate(" + x(d.Tm) + ",0)"; });
  }
  
  
  t1.selectAll(".team rect").attr("height", function(d) { return Math.abs(y(d.difference) - y(0)); })
                                     .attr("y", function(d) { return y(Math.max(0, d.difference)); });
                                     
  t1.selectAll(".teamLogo").attr("transform", imageTransform);
  
  t1.select(".y.axis")
      .call(yAxis);
  t1.select("#yLabel").text(yLabel);
  
}

function sortByRank(sorted) {
  if ((viewType === 'defense') && !(_.contains(defensiveDimensions, dimension)))
    sorted.sort(function(a, b) { return d3.descending(b.difference, a.difference); });
  else if ((viewType !== 'defense') && (_.contains(defensiveDimensions, dimension)))
    sorted.sort(function(a, b) { return d3.descending(b.difference, a.difference); });
  else
    sorted.sort(function(a, b) { return d3.descending(a.difference, b.difference); });
}

function redrawWithSort(grouping) {
  xGrouping = grouping;
  var sorted = teams;
  var t = svg.transition().duration(1000);
  if (xGrouping === 'rank') {
    sortByRank(sorted); 
  } else {
    sorted.sort(function(a, b) { return d3.ascending(a.Position, b.Position); });
  }
  x.domain(sorted.map(function(d) { return d.Tm; }));
  t.selectAll(".team").attr("transform", function(d) { return "translate(" + x(d.Tm) + ",0)"; });
}

//Converts Overall Stats -> overallStats
function classNameFromString(string) {
  var s = string.replace(" ", "");
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function capitalizeString(string) {
  return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
}

function showDetails() {
  var text = capitalizeString(dimension) + " Differential (" + viewButton + "): ";
  if (viewType === 'defense') 
    if (_.contains(defensiveDimensions, dimension)) 
      text += " Higher is Better";
    else
      text += " Lower is Better";
  else
    if (_.contains(defensiveDimensions, dimension)) 
      text += " Lower is Better";
    else
      text += " Higher is Better";
  d3.select("#details p").text(text);
}

$(".offense").on("click", "button", function(e) {
  $(".offense .btn").removeClass("active btn-success");
  $(this).addClass("active btn-success");
  if (dimension !== $(this).data("name")) {
    dimension = $(this).data("name");
    redraw();
  }
});

$(".view").on("click", "button", function(e) {
  $(this).siblings().removeClass("active btn-success");
  $(this).addClass("active btn-success");
  if (viewType !== $(this).data("name")) {
    viewType = $(this).data("name");
    viewButton = $(this).text();
    redraw();
  }
});

$(".group").on("click", "button", function(e) {
  $(this).siblings().removeClass("active btn-success");
  $(this).addClass("active btn-success");
  if (xGrouping !== $(this).data("name")) {
    var group = $(this).data("name");
    redrawWithSort(group);
  }
});

$(".category").on("click", "a", function(e) {
  e.preventDefault();
  var category = $(this).text();
  var existing = $("#selectedCategory").text();
  $("#selectedCategory").text(category);
  $(e.currentTarget).text(existing);
  $("#" + classNameFromString(existing)).addClass("hide");
  $("#" + classNameFromString(category)).removeClass("hide");
  
});
