const request = require('request-promise');
const fs = require('fs');
const api = `https://au-api.basiq.io`;
const apiKey = `MmU2NDljODctYTgzYS00MjYyLTg0MzEtNzNhZjY2ZjY3NzJjOjA1ZTA3N2UxLTliMTMtNGNkMC1iZjZjLTIyZTJjOTBlZGE0ZQ==`;


(async function main() {
    try {
        // Authentication
        const resToken = await request({
            url: `${api}/token`,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${apiKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'basiq-version': '2.0'
            }
        })

        const response = JSON.parse(resToken);
        const accessToken = response.access_token;
        
        // console.log("Authentication: ", response);
        console.log("accessToken: ", accessToken);

        // Create User
        bodyUser = {
            "email": "sandro@gmail.com",
            "mobile": "+38169100100",
            "firstName": "Sandro",
            "lastName": "Spanghero"
            }
        
        const resUser = await request({
            method: 'POST',
            body: bodyUser,
            json: true,
            url: `${api}/users`,        
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })

        const userID = resUser.id;
        // const userID = `47bc2450-60fa-4b53-aea5-b31dbc8a33e8`;           // Invalid connection
        // const userID = `8a84ab50-7950-478f-b63b-2de6e7b8cb95`;           // Active connection

        // console.log("Create User: ", resUser);
        console.log("User ID: ", userID);

        // Connect User
        bodyBank = {
            "loginId": "gavinBelson",
            "password": "hooli2016",
            "institution":{
                "id":"AU00000"
            }
          }

        const resConnect = await request({
            method: 'POST',
            body: bodyBank,
            json: true,
            url: `${api}/users/${userID}/connections`,        
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })

        // console.log("Connect User: ", resConnect);

        // List all Connections
        const resListConnections = await request({
            method: 'GET',
            json: true,
            url: `${api}/users/${userID}/connections`,        
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
            
        console.log("List all Connections: ", resListConnections);
        const connectionID = resListConnections.data[0].id;

        // Refresh All Connections
        // const resRefreshAll = await request({
        //     method: 'POST',
        //     json: true,
        //     url: `${api}/users/${userID}/connections/refresh`,        
        //     headers: {
        //         'Authorization': `Bearer ${accessToken}`
        //     }
        // })

        // console.log("Refresh All Connections: ", resRefreshAll);

        // Refresh Connection
        // const resRefresh = await request({
        //     method: 'POST',
        //     json: true,
        //     url: `${api}/users/${userID}/connections/${connectionID}/refresh`,        
        //     headers: {
        //         'Authorization': `Bearer ${accessToken}`
        //     }
        // })

        // console.log("Refresh Connection: ", resRefresh);

        // Delete Connection
        // const resDelete = await request({
        //     method: 'DELETE',
        //     json: true,
        //     url: `${api}/users/${userID}/connections/${connectionID}`,        
        //     headers: {
        //         'Authorization': `Bearer ${accessToken}`
        //     }
        // })
        
        // console.log("Delete Connection: ", resDelete);

        // await new Promise(r => setTimeout(r, 30000));

        // List all Transactions
        let transactionsData = [];
        let resTransactions = [];                
        while (transactionsData.length === 0) {
            resTransactions = await request({
                method: 'GET',
                json: true,
                url: `${api}/users/${userID}/transactions`,        
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            transactionsData = resTransactions.data;
        }

        const tempData = JSON.stringify(transactionsData);
        const rawTransData = tempData.replace(']','');

        // Create transactions.json file
        fs.writeFile('transactions.json', rawTransData, (err) => {
            if (err) {
                throw err;
            }
            console.log("JSON saved.");
        });

        // Append transactions.json file
        let nextPage = resTransactions.links.next;        
        for (;nextPage != undefined;) {
            const resTransactionsPag = await request({
                method: 'GET',
                json: true,
                url: `${nextPage}`,        
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            const transactionsDataPag = resTransactionsPag.data;
            const tempDataPag = JSON.stringify(transactionsDataPag);
            const rawTransDataPag = tempDataPag.replace('[',',').replace(']','');

            fs.appendFile('transactions.json', rawTransDataPag, (err) => {
                if (err) {
                    throw err;
                }
                console.log("JSON appended.");
            });
            nextPage = resTransactionsPag.links.next;
        }
        
        // Append ']' in transactions.json due to parsing
        await new Promise(r => setTimeout(r, 3000));
        
        const rawChar = ']';
        
        fs.appendFile('transactions.json', rawChar, (err) => {
            if (err) {
                throw err;
            }
            console.log("JSON appended.");
        });

        // Parser
        await new Promise(r => setTimeout(r, 3000));
        fs.readFile('transactions.json', 'utf8', function (err, data) {
            if (err) {
              return;
            }          
            jsonData = JSON.parse(data); 
            
            var readTransData = jsonData,
                groups = Object.create(null),
                result;

            let keysCategory = [];
            readTransData.forEach(function (jsonObject) {
                if (jsonObject.subClass === null) {
                    delete readTransData.jsonObject;
                } else {
                    if (keysCategory.indexOf(jsonObject.subClass.code) === -1) {
                        keysCategory.push(jsonObject.subClass.code);
                    };
                    groups[jsonObject.subClass.code] = groups[jsonObject.subClass.code] || [];
                    groups[jsonObject.subClass.code].push(jsonObject); 
                }  
            });

            keysCategory.sort();

            result = Object.keys(groups).map(function (k) {
                var temp = {};
                temp[k] = groups[k];
                return temp;
            });
            
            let avgValues = [];
            let avgKeys = ["Fuel Retailing", "Supermarket and Grocery Stores", 
                            "Specialised Food Retailing", "Cafes, Restaurants and Takeaway Food Services", 
                            "Pubs, Taverns and Bars"];
            for (i=0; i < keysCategory.length; i++){
                let sum = 0;
                const ind = keysCategory[i];
                const categoryData = result[i][ind];
                for (j=0; j < categoryData.length; j++) {
                    sum += parseInt(categoryData[j].amount);
                }
                var average = sum / categoryData.length;
                avgValues.push(average);
            }
            
            var avgResults = {};
            for (var i = 0; i < avgKeys.length; i++) {
                avgResults[avgKeys[i]] = avgValues[i];
            }

            // Display average payments per category
            console.log(avgResults)
        });

    } catch (e) {
    console.log("Error: ", e.message);
    }
})();

