/*
    Author: Jessmer John Palanca
    Section: CSC337 Web Programming SPRING2019, Homework 6
    Filename: gerrymandering.js
    Description: The json file for the gerrymandering.html
*/

'use strict';

(function() {
    /** when the search button is click, go to the fetchData function.
    */
    window.onload = function() {
        document.getElementById("search").onclick = fetchData;
    };

    /** This is the main function that fetches and processes the data from the
      * gerrymandering service.
    */
    function fetchData(){
        // resets the page whenever the user enters a new state
        reset();
        let i = 0;
        // getting the user input from the search box
        let state = document.getElementById("box").value.toLowerCase();
        // a loop that fethes the voter's data at the first iteration, and
        // the district's data at the second iteration
        while (i < 2){
            let type = "";
            if (i === 0){
                type = "voters";
            }
            else{
                type = "districts";
            }
            let url = "http://localhost:3000/?state="+state+"&type="+type;
            // fetching the voter's data
            if (i === 0){
                fetch(url)
                    .then(checkStatus)
                    .then(function(responseText) {
                        // adding the voter's data into the voter's div in the html
                        document.getElementById("voters").innerHTML = "<h4>" +
                                    responseText + " eligible voters</h4>";
                    })
                    .catch(function(error){
                        document.getElementById("errors").innerHTML = error;
                    });
            }
            // fetching the district's data
            else{
                fetch(url)
                    .then(checkStatus)
                    .then(function(responseText) {
                        // parsing the data into a JSON format
                        let json = JSON.parse(responseText);
                        // adding the state name into the statename's div in the html
                        document.getElementById("statename").innerHTML = "<h2>" +
                                    json.state + "</h2>";
                        // variable to use for creating divs inside the statedata div
                        let statedata = document.getElementById("statedata");
                        // an array (an array of array [[],[],[],...]) variable to
                        // store all the district data read from the file that is
                        // to be used for determining the gerrymander.
                        // [[demVotes, gopVotes],[demVotes, gopVotes],...]
                        let districtData = [];
                        for (let i = 0; i < json.districts.length; i++){
                            let newArray = [];
                            // adding two elements into the newArray
                            let demVotes = parseInt(json.districts[i][0]);
                            newArray.push(demVotes);
                            let gopVotes = parseInt(json.districts[i][1]);
                            newArray.push(gopVotes);
                            // creating a new div that is the parent div for the dem and gop divs
                            let newDiv = document.createElement("div");
                            newDiv.classList.add("newDiv");
                            // creating div for dem, append this div to the parent div (newDiv), and
                            // calculating the width of the dem div
                            let dem = document.createElement("div");
                            dem.classList.add("dem");
                            dem.id = "demID" + i;
                            let demWidth = calculateWidth(demVotes, demVotes, gopVotes);
                            newDiv.appendChild(dem);
                            // creating div for gop, append this div to the parent div (newDiv), and
                            // calculating the width of the gop div
                            let gop = document.createElement("div");
                            gop.classList.add("gop");
                            gop.id = "gopID" + i;
                            let gopWidth = calculateWidth(gopVotes, demVotes, gopVotes);
                            newDiv.appendChild(gop);
                            // appending the parent div (newDiv) in the statedata div
                            statedata.appendChild(newDiv);
                            // setting the width for the dem and gop divs
                            document.getElementById("demID"+i).style.width = demWidth + "%";
                            document.getElementById("gopID"+i).style.width = gopWidth + "%";
                            districtData.push(newArray);
                        }
                        // calling the function to determine whether or not the state is
                        // gerrymandered passing the district data
                        calculateGerryMander(districtData);
                    });
            }
            i++;
        }
    }

    /** This function calculates the width of the div for the dem and gop
    */
    function calculateWidth(numerator, dem, gop){
        let width = (numerator / (dem + gop)) * 100;
        return width;
    }

    /** This function processes the district data for determining the whether the state is
      * gerrymandered or not
    */
    function calculateGerryMander(data){
        // an array of array ([[],[],[],...]) variable that stores the wasted votes data for
        // both dem and gop
        // [[demWasted, gopWasted], [demWasted, gopWasted], ...]
        let wastedVotes = [];
        for (let i = 0; i < data.length; i++){
            let newArray = [];
            let sum = data[i][0] + data[i][1];
            let half = Math.floor(sum / 2) + 1;
            // dem's district votes is less than the gop's district votes
            if (data[i][0] < data[i][1]){
                newArray.push(data[i][0]);
                let gopWasted = data[i][1] - half;
                newArray.push(gopWasted);
            }
            // gop's district votes is less than the dem's votes
            else{
                let demWasted = data[i][0] - half;
                newArray.push(demWasted);
                newArray.push(data[i][1]);
            }
            wastedVotes.push(newArray);
        }
        let lessWastedVotes = "";
        let totalDemVotes = 0;
        let totalGopVotes = 0;
        // summing all the wasted votes for every districts at that state
        for (let i = 0; i < wastedVotes.length; i++){
            totalDemVotes += wastedVotes[i][0];
            totalGopVotes += wastedVotes[i][1];
        }
        if (totalDemVotes < totalGopVotes){
            lessWastedVotes = "Democratic";
        }
        else{
            lessWastedVotes = "Republican";
        }
        // difference of the total wasted votes for dem and gop
        let totalWastedDifference = Math.abs(totalDemVotes - totalGopVotes);
        let totalWastedVotes = (totalDemVotes + totalGopVotes);
        // difference percentage of the total wasted votes for both parties
        let differencePercentage = (totalWastedDifference / totalWastedVotes) * 100;
        console.log(differencePercentage);

        let newElement = document.createElement("h3");
        // determining the gerrymander status of the state, add the result to the html page
        // the state is considered gerrymandered if the difference percentage is equal
        // or greater than 7%
        if(differencePercentage >= 7){
            let text = document.createTextNode("Gerrymandered to favor the " +
                        lessWastedVotes + " Party");
            newElement.appendChild(text);
        }
        else{
            let text = document.createTextNode("Not gerrymandered");
            newElement.appendChild(text);
        }
        let result = document.getElementById("statename");
        result.appendChild(newElement);
    }

    /** a function that checks and catches errors when the file is being fetched
    */
    function checkStatus(response){
        if(response.status >= 200 && response.status < 300){
            return response.text();
        }
        else if(response.status === 400){
            return Promise.reject(new Error("Missing a necessary parameter."));
        }
        else if (response.status === 404){
            return Promise.reject(new Error("File not found."));
        }
        else if (response.status === 410){
            return Promise.reject(new Error("This state does not have any data."));
        }
        else{
            return Promise.reject(new Error(response.status+": "+response.statusText));
        }
    }

    /** function that resets the divs when the page had just opened or when the user
      * searches a new state
    */
    function reset(){
        document.getElementById("statedata").innerHTML = "";
        document.getElementById("voters").innerHTML = "";
        document.getElementById("statename").innerHTML = "";
        document.getElementById("errors").innerHTML = "";
    }

})();
