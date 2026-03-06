const SHEET_NAME = 'entries';
const BASE_COLUMNS = [
  'ID',
  '登録日',
  '登録日時',
  '拠点番号',
  '担当名',
  '提案件数',
  '証券回収',
  '獲得件数',
  '区分',
  '重複判定'
];

function doGet() {
  ensureSheet_();
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('営業入力・管理アプリ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function ensureSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.getRange(1, 1, 1, BASE_COLUMNS.length).setValues([BASE_COLUMNS]);
    sheet.setFrozenRows(1);
  } else {
    const header = sheet.getRange(1, 1, 1, BASE_COLUMNS.length).getValues()[0];
    if (header.join('|') !== BASE_COLUMNS.join('|')) {
      sheet.getRange(1, 1, 1, BASE_COLUMNS.length).setValues([BASE_COLUMNS]);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function getMasterData() {
  return {
    baseOptions: ['01','02','03','04','05','07','10','12','13','14','15','16','17'],
    categoryOptions: ['新規', '保有期'],
    duplicateOptions: ['重複未確認', '重複あり', '重複なし']
  };
}

function saveEntry(payload) {
  validatePayload_(payload);
  const sheet = ensureSheet_();
  const now = new Date();
  const tz = Session.getScriptTimeZone() || 'Asia/Tokyo';
  const dateStr = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  const datetimeStr = Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm:ss');
  const row = [
    Utilities.getUuid(),
    dateStr,
    datetimeStr,
    payload.baseNo,
    payload.staffName,
    Number(payload.proposalCount),
    Number(payload.policyCollection),
    Number(payload.acquisitionCount),
    payload.category,
    '重複未確認'
  ];
  sheet.appendRow(row);
  return { success: true, message: '登録しました。' };
}

function validatePayload_(payload) {
  if (!payload) throw new Error('データがありません。');
  const baseList = getMasterData().baseOptions;
  if (!baseList.includes(String(payload.baseNo || ''))) throw new Error('拠点番号が不正です。');
  if (!String(payload.staffName || '').trim()) throw new Error('担当名を入力してください。');
  ['proposalCount', 'policyCollection', 'acquisitionCount'].forEach(function(key) {
    const value = payload[key];
    if (value === '' || value === null || value === undefined || isNaN(Number(value)) || Number(value) < 0) {
      throw new Error('数値項目を正しく入力してください。');
    }
  });
  const categories = getMasterData().categoryOptions;
  if (!categories.includes(String(payload.category || ''))) throw new Error('区分が不正です。');
}

function getEntries(filters) {
  const sheet = ensureSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return buildResponse_([]);
  }

  const rows = values.slice(1).map(function(row) {
    return {
      id: row[0],
      entryDate: row[1],
      createdAt: row[2],
      baseNo: row[3],
      staffName: row[4],
      proposalCount: Number(row[5] || 0),
      policyCollection: Number(row[6] || 0),
      acquisitionCount: Number(row[7] || 0),
      category: row[8],
      duplicateStatus: row[9] || '重複未確認'
    };
  });

  const filtered = rows.filter(function(item) {
    if (filters) {
      if (filters.dateFrom && item.entryDate < filters.dateFrom) return false;
      if (filters.dateTo && item.entryDate > filters.dateTo) return false;
      if (filters.baseNo && item.baseNo !== filters.baseNo) return false;
      if (filters.staffName && item.staffName.toLowerCase().indexOf(String(filters.staffName).toLowerCase()) === -1) return false;
    }
    return true;
  }).sort(function(a, b) {
    return a.createdAt < b.createdAt ? 1 : -1;
  });

  return buildResponse_(filtered);
}

function buildResponse_(rows) {
  const totals = rows.reduce(function(acc, item) {
    acc.count += 1;
    acc.proposalCount += item.proposalCount;
    acc.policyCollection += item.policyCollection;
    acc.acquisitionCount += item.acquisitionCount;
    if (item.category === '新規') acc.newCount += item.acquisitionCount;
    if (item.category === '保有期') acc.retentionCount += item.acquisitionCount;
    if (item.duplicateStatus === '重複あり') acc.duplicateMarked += 1;
    return acc;
  }, {
    count: 0,
    proposalCount: 0,
    policyCollection: 0,
    acquisitionCount: 0,
    newCount: 0,
    retentionCount: 0,
    duplicateMarked: 0
  });

  return {
    rows: rows,
    totals: totals
  };
}

function updateDuplicateStatus(id, status) {
  const allowed = getMasterData().duplicateOptions;
  if (!allowed.includes(status)) throw new Error('重複判定が不正です。');
  const sheet = ensureSheet_();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.getRange(i + 1, 10).setValue(status);
      return { success: true };
    }
  }
  throw new Error('対象データが見つかりません。');
}
