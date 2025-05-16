// A simple script to simulate production-like environment
const express = require('express');
const app = express();
const port = 3001; // Using a different port to simulate cross-origin

// Basic HTML page that makes requests to the main Poopalotzi app
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Simulated Production Environment</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
        }
        button {
          background-color: #0B1F3A;
          color: white;
          border: none;
          padding: 10px 20px;
          margin: 10px 0;
          border-radius: 4px;
          cursor: pointer;
        }
        pre {
          background-color: #f4f4f4;
          padding: 10px;
          border-radius: 4px;
          overflow: auto;
          max-height: 400px;
        }
        .error {
          color: red;
        }
        .success {
          color: green;
        }
      </style>
    </head>
    <body>
      <h1>Poopalotzi Production Simulator</h1>
      <p>This page simulates a cross-origin request to the Poopalotzi API.</p>
      
      <div>
        <h2>Test Service Levels API</h2>
        <button id="testApi">Fetch Service Levels</button>
        <div id="apiResult"></div>
      </div>
      
      <script>
        document.getElementById('testApi').addEventListener('click', async () => {
          const result = document.getElementById('apiResult');
          result.innerHTML = '<p>Loading...</p>';
          
          try {
            // This is a cross-origin request since we're on port 3001 requesting from port 5000
            const response = await fetch('http://localhost:5000/api/service-levels', {
              method: 'GET',
              credentials: 'include', // Important for cookies
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              throw new Error(\`Error: \${response.status} \${response.statusText}\`);
            }
            
            const data = await response.json();
            result.innerHTML = \`<pre class="success">\${JSON.stringify(data, null, 2)}</pre>\`;
            
          } catch (error) {
            result.innerHTML = \`<pre class="error">\${error.toString()}</pre>\`;
          }
        });
      </script>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Production simulator running at http://localhost:${port}`);
});