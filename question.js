
const fs = require('fs');
const bigInt = require('big-integer');
const Fraction = require('fraction.js');

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

function main() {
    const filename = 'input2.json'; 

    try {

        const data = fs.readFileSync(filename, 'utf8');
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
            console.log('Not enough points to compute the polynomial.');
            return;
        }

        let selectedPoints = points.slice(0, k);


        selectedPoints = selectedPoints.map(p => ({
            x: p.x,
            y: new Fraction(p.y.toString())
        }));


        let c = lagrangeInterpolation(selectedPoints, k);


        c = c.simplify();

        if (c.d !== 1) { 
            console.log('The constant term c is a fraction:');
            console.log(`${c.n.toString()} / ${c.d.toString()}`);
        } else {
            console.log('The constant term c is:');
            console.log(c.n.toString());
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}
main();