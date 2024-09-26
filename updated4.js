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
        let term = L_i.mul(new Fraction(points[i].y.toString()));
        c = c.add(term);
    }
    return c;
}

function findImposters(points, k) {
    const n = points.length;
    if (n <= k + 3) {
        return { validPoints: points, imposters: [] };
    }
    const combinations = getCombinations(points, n - 3, n);
    let bestCombination = null;
    let maxConsistentCount = 0;

    for (const combination of combinations) {
        const subCombinations = getCombinations(combination, k, combination.length);
        const results = new Map();

        for (const subComb of subCombinations) {
            const c = lagrangeInterpolation(subComb, k);
            const key = c.toString();
            results.set(key, (results.get(key) || 0) + 1);
        }

        const [mostConsistentResult, count] = [...results.entries()].reduce((max, entry) => 
            entry[1] > max[1] ? entry : max
        , ['', 0]);

        if (count > maxConsistentCount) {
            maxConsistentCount = count;
            bestCombination = combination;
        }
    }

    const validPoints = new Set(bestCombination.map(p => p.x));
    const imposters = points.filter(p => !validPoints.has(p.x));

    return { validPoints: bestCombination, imposters };
}

function getCombinations(array, k, maxItems = array.length) {
    const result = [];
    
    function backtrack(start, current) {
        if (current.length === k) {
            result.push([...current]);
            return;
        }
        
        for (let i = start; i < Math.min(array.length, maxItems); i++) {
            current.push(array[i]);
            backtrack(i + 1, current);
            current.pop();
        }
    }
    
    backtrack(0, []);
    return result;
}

function helper(filename) {
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
            console.log(`Not enough points in ${filename} to compute the polynomial.`);
            return;
        }

        let validPoints, imposters;
        if (points.length > k) {
            console.log(`Detecting and excluding imposter points for ${filename}...`);
            ({ validPoints, imposters } = findImposters(points, k));
        } else {
            validPoints = points;
            imposters = [];
        }

        let c = lagrangeInterpolation(validPoints.slice(0, k), k);
        c = c.simplify();

        if (c.d !== 1) {
            console.log(`The constant term c for ${filename} is a fraction:`);
            console.log(`${c.n.toString()} / ${c.d.toString()}`);
        } else {
            console.log(`The constant term c for ${filename} is:`);
            console.log(c.n.toString());
        }

        if (imposters.length > 0) {
            console.log(`Number of imposter points: ${imposters.length}`);
            console.log("Imposter points:");
            imposters.forEach(p => {
                console.log(`  x: ${p.x}, y: ${p.y.toString()}`);
            });
        } else {
            console.log("No imposter points detected.");
        }
    } catch (error) {
        console.error(`Error processing ${filename}:`, error.message);
    }
}

function main() {
    const filenames = ['input1.json', 'input2.json'];
    filenames.forEach(filename => {
        console.log(`\nProcessing ${filename}:`);
        helper(filename);
    });
}

main();