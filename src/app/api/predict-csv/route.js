import { NextResponse } from 'next/server';

// Convert time string to minutes since midnight
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Convert minutes to time string HH:MM
function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Convert minutes to 12-hour format HH:MM AM/PM
function minutesToTime12(mins) {
  const adjustedMins = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(adjustedMins / 60);
  const m = adjustedMins % 60;
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const period = h >= 12 ? 'PM' : 'AM';
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

// Polynomial regression (degree 2)
function polyFit(x, y, degree = 2) {
  const n = x.length;
  const m = degree + 1;
  const A = Array(m).fill(0).map(() => Array(m).fill(0));
  const B = Array(m).fill(0);

  for (let i = 0; i < n; i++) {
    let xp = 1;
    for (let j = 0; j < m; j++) {
      let xp2 = 1;
      for (let k = 0; k < m; k++) {
        A[j][k] += xp2;
        xp2 *= x[i];
      }
      B[j] += y[i] * xp;
      xp *= x[i];
    }
  }

  // Gauss elimination
  for (let i = 0; i < m; i++) {
    let maxRow = i;
    for (let k = i + 1; k < m; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
    }
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    [B[i], B[maxRow]] = [B[maxRow], B[i]];

    for (let k = i + 1; k < m; k++) {
      const c = A[k][i] / A[i][i];
      for (let j = i; j < m; j++) A[k][j] -= c * A[i][j];
      B[k] -= c * B[i];
    }
  }

  const coeff = Array(m);
  for (let i = m - 1; i >= 0; i--) {
    coeff[i] = B[i];
    for (let j = i + 1; j < m; j++) coeff[i] -= A[i][j] * coeff[j];
    coeff[i] /= A[i][i];
  }
  return coeff;
}

// Evaluate polynomial
function evalPoly(coeff, x) {
  let result = 0;
  let xp = 1;
  for (let c of coeff) {
    result += c * xp;
    xp *= x;
  }
  return Math.max(0, Math.min(200, result));
}

export async function POST(req) {
  try {
    const { csv } = await req.json();

    if (!csv || typeof csv !== 'string') {
      return NextResponse.json({ ok: false, error: 'CSV string required' }, { status: 400 });
    }

    // Parse CSV
    const lines = csv.trim().split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) {
      return NextResponse.json({ ok: false, error: 'CSV must have header and at least one row' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(',').map(c => c.trim());
      const record = {};
      headers.forEach((h, idx) => {
        record[h] = cells[idx];
      });
      records.push(record);
    }

    // Group by zone
    const byZone = {};
    for (const r of records) {
      const z = r.zone || 'unknown';
      if (!byZone[z]) byZone[z] = [];
      byZone[z].push({
        bin_id: r.bin_id || 'UNKNOWN',
        fill_level: parseInt(r.fill_level) || 0,
        time_of_day: r.time_of_day || '00:00'
      });
    }

    const results = [];

    for (const zone of Object.keys(byZone)) {
      const items = byZone[zone];
      if (items.length === 0) continue;

      const binId = items[0].bin_id;

      // Sort by time to create proper sequence
      items.sort((a, b) => timeToMinutes(a.time_of_day) - timeToMinutes(b.time_of_day));

      // Extract X (time in minutes) and Y (fill level)
      const x = items.map(i => timeToMinutes(i.time_of_day));
      const y = items.map(i => i.fill_level);

      // Current fill is the latest reading
      const currentFill = y[y.length - 1] || Math.round(y.reduce((s, v) => s + v, 0) / y.length);

      // Fit polynomial model
      let coeff = null;
      if (y.length >= 3) {
        coeff = polyFit(x, y, 2); // quadratic
      } else if (y.length >= 2) {
        // linear fit
        const xm = x.reduce((s, v) => s + v, 0) / x.length;
        const ym = y.reduce((s, v) => s + v, 0) / y.length;
        let num = 0, den = 0;
        for (let i = 0; i < x.length; i++) {
          num += (x[i] - xm) * (y[i] - ym);
          den += (x[i] - xm) * (x[i] - xm);
        }
        const b = den === 0 ? 0 : num / den;
        const a = ym - b * xm;
        coeff = [a, b];
      } else {
        coeff = [y[0]];
      }

      // Predict for next 24 hours
      const predictions = [];
      const now = timeToMinutes(items[items.length - 1].time_of_day);

      for (let step = 0; step < 48; step++) {
        const futureMin = (now + step * 30) % 1440;
        const pred = evalPoly(coeff, futureMin);
        predictions.push(pred);
      }

      // Find threshold crossing times
      let halfTime = '—';
      let fullTime = '—';
      let overflowTime = '—';

      for (let step = 0; step < predictions.length; step++) {
        const futureMin = (now + step * 30);
        const timeStr = minutesToTime12(futureMin);

        if (halfTime === '—' && predictions[step] >= 50) {
          halfTime = timeStr;
        }
        if (fullTime === '—' && predictions[step] >= 90) {
          fullTime = timeStr;
        }
        if (overflowTime === '—' && predictions[step] >= 100) {
          overflowTime = timeStr;
        }

        if (halfTime !== '—' && fullTime !== '—' && overflowTime !== '—') break;
      }

      // If not found, estimate based on current and average rate
      if (halfTime === '—' || fullTime === '—' || overflowTime === '—') {
        const maxPred = Math.max(...predictions);
        const minPred = Math.min(...predictions);
        const fillRange = maxPred - minPred || 1;
        const hoursData = x.length;
        const ratePerHour = fillRange / Math.max(hoursData, 1);

        if (halfTime === '—') {
          if (currentFill < 50) {
            const h = Math.ceil((50 - currentFill) / Math.max(ratePerHour, 0.5));
            halfTime = minutesToTime12(now + Math.min(h * 60, 1440));
          } else {
            halfTime = minutesToTime12(now + 30);
          }
        }

        if (fullTime === '—') {
          if (currentFill < 90) {
            const h = Math.ceil((90 - currentFill) / Math.max(ratePerHour, 0.5));
            fullTime = minutesToTime12(now + Math.min(h * 60, 1440));
          } else {
            fullTime = minutesToTime12(now + 60);
          }
        }

        if (overflowTime === '—') {
          if (currentFill < 100) {
            const h = Math.ceil((100 - currentFill) / Math.max(ratePerHour, 0.5));
            overflowTime = minutesToTime12(now + Math.min(h * 60, 1440));
          } else {
            overflowTime = minutesToTime12(now + 90);
          }
        }
      }

      // Determine condition based on CSV data patterns
      let condition = 'Low Usage';
      const peakFill = Math.max(currentFill, Math.max(...predictions));
      const avgRate = y.length > 1 ? (y[y.length - 1] - y[0]) / Math.max(y.length - 1, 1) : 0;
      
      // Check if overflow will happen in next 8 hours (16 prediction steps)
      const nearTermOverflow = predictions.slice(0, 16).some(p => p >= 100);
      const nearTermFull = predictions.slice(0, 16).some(p => p >= 90);
      
      if (currentFill >= 100) {
        condition = 'Overflow Risk';
      } else if (nearTermOverflow || (currentFill >= 90 && avgRate > 0)) {
        condition = 'Overflow Risk';
      } else if (currentFill >= 90 || nearTermFull) {
        condition = 'Peak Usage';
      } else if (currentFill >= 70 || peakFill >= 80) {
        condition = 'High Activity';
      } else if (currentFill >= 50 || peakFill >= 60) {
        condition = 'Moderate';
      } else if (currentFill >= 30 || peakFill >= 40 || avgRate > 1) {
        condition = 'Moderate';
      } else {
        condition = 'Low Usage';
      }

      results.push({
        binId,
        zone,
        halfTime,
        fullTime,
        overflowTime,
        currentFill: Math.round(currentFill),
        condition
      });
    }

    return NextResponse.json({ ok: true, data: results });
  } catch (err) {
    console.error('CSV prediction error', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}