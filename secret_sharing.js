document.getElementById('decodeButton').addEventListener('click', () => {
    const fileInput = document.getElementById('fileInput');
    const outputDiv = document.getElementById('output');
    
    if (fileInput.files.length === 0) {
        outputDiv.textContent = 'Please select a JSON file.';
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const jsonData = event.target.result;
        processJson(jsonData);
    };

    reader.readAsText(file);
});

function processJson(data) {
    const outputDiv = document.getElementById('output');
    try {
        const jsonObject = JSON.parse(data);
        const n = parseInt(jsonObject.keys.n);
        const k = parseInt(jsonObject.keys.k);
        let points = [];

        for (let key in jsonObject) {
            if (key === 'keys') continue;

            let x_i = parseInt(key);
            let point = jsonObject[key];
            let base = parseInt(point.base);
            let valueStr = point.value;

            let y_i = decodeValue(valueStr, base);
            points.push({ x: x_i, y: y_i });
        }

        points.sort((a, b) => a.x - b.x);

        if (points.length < k) {
            outputDiv.textContent = 'Not enough points to compute the polynomial.';
            return;
        }

        let selectedPoints = points.slice(0, k);
        selectedPoints = selectedPoints.map(p => ({
            x: p.x,
            y: new Fraction(p.y.toString())
        }));

        let c = lagrangeInterpolation(selectedPoints, k);

        if (c instanceof Fraction) {
            outputDiv.textContent = c.d !== 1 
                ? `The constant term c is a fraction: ${c.n} / ${c.d}`
                : `The constant term c is: ${c.n}`;
        } else {
            outputDiv.textContent = 'Error: Unable to compute the constant term.';
        }
    } catch (error) {
        outputDiv.textContent = 'Error: ' + error.message;
        console.error('Detailed error:', error);
    }
}

function decodeValue(valueStr, base) {
    return bigInt(valueStr, base);
}

function lagrangeInterpolation(points, k) {
    let c = new Fraction(0);

    for (let i = 0; i < k; i++) {
        let numerator = new Fraction(1);
        let denominator = new Fraction(1);

        for (let j = 0; j < k; j++) {
            if (i !== j) {
                numerator = numerator.mul(new Fraction(-points[j].x));
                denominator = denominator.mul(new Fraction(points[i].x - points[j].x));
            }
        }

        let L_i = numerator.div(denominator);
        let term = L_i.mul(points[i].y);
        c = c.add(term);
    }

    return c;
}

// Debugging check for Fraction
if (typeof Fraction === 'undefined') {
    console.error('Fraction is not loaded. Check the CDN link.');
} else {
    console.log('Fraction loaded successfully.');
}