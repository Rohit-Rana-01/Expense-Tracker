/* script.js — Neon Dark Beginner Version
   - localStorage persistence
   - Add / Edit / Delete
   - Summary totals
   - Chart (Chart.js) for Income vs Expense
   - Theme selector & dark toggle
   - Simple comments to explain each block
*/

// ---------- Simple data storage ----------
const STORAGE_KEY = 'bw_transactions_v1';
let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let editingIndex = null;

// ---------- Elements ----------
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const totalBalanceEl = document.getElementById('total-balance');
const listEl = document.getElementById('list');
const form = document.getElementById('expense-form');
const saveBtn = document.getElementById('save-btn');
const clearBtn = document.getElementById('clear-btn');

const darkToggle = document.getElementById('dark-toggle');
const themeSelect = document.getElementById('theme-select');

// Chart.js setup (simple doughnut chart)
let chart = null;
const ctx = document.getElementById('breakdownChart').getContext('2d');

function createChart(labels, data) {
  if (chart) chart.destroy();
  // neon color palette tuned to accent
  const palette = ['#b78bff', '#8e2de2', '#c48bff', '#6a0dad', '#a07cff', '#51227a'];
  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{ data: data, backgroundColor: palette.slice(0, labels.length) }]
    },
    options: {
      plugins: { legend: { position: 'bottom', labels: { color: '#ddd' } } },
      animation: { duration: 500 },
      maintainAspectRatio: false
    }
  });
}

// ---------- Utilities ----------
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function formatCurrency(n){
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

// ---------- Render UI ----------
function renderSummary() {
  let income = 0, expense = 0;
  transactions.forEach(t => {
    if (t.type === 'Income') income += Number(t.amount);
    else expense += Number(t.amount);
  });
  totalIncomeEl.textContent = formatCurrency(income);
  totalExpenseEl.textContent = formatCurrency(expense);
  totalBalanceEl.textContent = formatCurrency(income - expense);
}

// ---------- Render List ----------
function renderList() {
  listEl.innerHTML = '';
  // show newest first
  transactions.slice().reverse().forEach((t, idxFromEnd) => {
    const idx = transactions.length - 1 - idxFromEnd;

    const row = document.createElement('div');
    row.className = 'item';

    row.innerHTML = `
      <div class="text">
        <strong>${escapeHtml(t.description)}</strong>
        <div><small>${t.date} • ${t.type}</small></div>
      </div>

      <div class="actions">
        <div class="${t.type === 'Income' ? 'amount-income' : 'amount-expense'}">
          ${t.type === 'Income' ? '+' : '-'}${formatCurrency(t.amount)}
        </div>
        <button class="edit" onclick="startEdit(${idx})">Edit</button>
        <button class="del" onclick="removeItem(${idx})">Delete</button>
      </div>
    `;

    listEl.appendChild(row);
  });
}

// ---------- Chart Rendering ----------
function renderChart() {
  // Group expenses by description (or category later)
  const expenses = transactions.filter(t => t.type === 'Expense');
  const map = {};
  expenses.forEach(e => { map[e.description] = (map[e.description] || 0) + Number(e.amount); });
  const labels = Object.keys(map).slice(0, 8);
  const data = labels.map(l => map[l]);
  if (labels.length === 0) {
    createChart(['No expenses'], [1]);
  } else {
    createChart(labels, data);
  }
}

// ---------- Main render helper ----------
function renderAll() {
  renderSummary();
  renderList();
  renderChart();
}

// ---------- Add / Update ----------
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const type = document.getElementById('type').value;
  const description = document.getElementById('description').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const date = document.getElementById('date').value;

  if (!description || !date || !amount || isNaN(amount)) { alert('Please complete all fields correctly.'); return; }

  const entry = { type, description, amount: Number(amount.toFixed(2)), date };

  if (editingIndex !== null) {
    transactions[editingIndex] = entry;
    editingIndex = null;
    saveBtn.textContent = 'Save';
  } else {
    transactions.push(entry);
  }

  saveToStorage();
  form.reset();
  renderAll();
});

// ---------- Edit helpers ----------
function startEdit(index) {
  const t = transactions[index];
  document.getElementById('type').value = t.type;
  document.getElementById('description').value = t.description;
  document.getElementById('amount').value = t.amount;
  document.getElementById('date').value = t.date;
  editingIndex = index;
  saveBtn.textContent = 'Update';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- Remove ----------
function removeItem(index) {
  if (!confirm('Delete this transaction?')) return;
  transactions.splice(index, 1);
  saveToStorage();
  renderAll();
}

// ---------- Clear All ----------
clearBtn.addEventListener('click', () => {
  if (!confirm('Clear all transactions?')) return;
  transactions = [];
  saveToStorage();
  renderAll();
});

// ---------- Theme & Dark Mode ----------
function escapeHtml(unsafe) {
  return unsafe.replace(/[&<"']/g, function(m){ return {'&':'&amp;','<':'&lt;','"':'&quot;',"'":"&#039;"}[m]; });
}

function applyTheme(name) {
  document.documentElement.className = ''; // reset
  if (name && name.startsWith('neon-')) {
    document.documentElement.classList.add('theme-' + name.replace('neon-', 'neon-'));
  }
}
function applyDarkMode(on) {
  if (on) document.body.classList.add('dark');
  else document.body.classList.remove('dark');
}

// persist theme/dark choices
themeSelect.addEventListener('change', (e) => {
  const val = e.target.value;
  // apply theme class like theme-neon-purple, theme-neon-blue etc
  document.documentElement.className = 'theme-' + val;
  localStorage.setItem('bw_theme', val);
});
darkToggle.addEventListener('change', (e) => {
  applyDarkMode(e.target.checked);
  localStorage.setItem('bw_dark', e.target.checked ? '1' : '0');
});

// Load saved preferences
const savedTheme = localStorage.getItem('bw_theme') || 'neon-purple';
themeSelect.value = savedTheme;
document.documentElement.className = 'theme-' + savedTheme;

const savedDark = localStorage.getItem('bw_dark') === '1';
darkToggle.checked = savedDark;
applyDarkMode(savedDark);

// ---------- Initial render ----------
renderAll();

// tiny visual entrance
window.addEventListener('load', () => {
  document.querySelector('.container').style.opacity = 1;
});
