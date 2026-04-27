// ============================================================
// TASK BOARD — Google Apps Script
// Googleスプレッドシートにコピペして使ってください
// ============================================================

const SHEET_NAME = 'tasks';

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'getTasks') {
    return getTasksResponse();
  }
  return jsonResponse({ error: 'unknown action' });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  if (action === 'addTask') {
    return addTaskResponse(data.task);
  }
  if (action === 'updateTask') {
    return updateTaskResponse(data.task);
  }
  if (action === 'deleteTask') {
    return deleteTaskResponse(data.id);
  }

  return jsonResponse({ error: 'unknown action' });
}

// タスク一覧取得
function getTasksResponse() {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();

  // 1行目はヘッダー
  const tasks = rows.slice(1).map(r => ({
    id:        String(r[0]),
    project:   r[1],
    due:       r[2] ? Utilities.formatDate(new Date(r[2]), 'Asia/Tokyo', 'yyyy-MM-dd') : '',
    task:      r[3],
    note:      r[4],
    createdAt: r[5]
  })).filter(t => t.id && t.id !== '');

  return jsonResponse({ tasks });
}

// タスク追加
function addTaskResponse(task) {
  const sheet = getSheet();
  sheet.appendRow([
    task.id,
    task.project,
    task.due,
    task.task,
    task.note || '',
    task.createdAt
  ]);
  return jsonResponse({ success: true });
}

// タスク更新
function updateTaskResponse(task) {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(task.id)) {
      sheet.getRange(i + 1, 2).setValue(task.project);
      sheet.getRange(i + 1, 3).setValue(task.due);
      sheet.getRange(i + 1, 4).setValue(task.task);
      sheet.getRange(i + 1, 5).setValue(task.note || '');
      break;
    }
  }
  return jsonResponse({ success: true });
}

// タスク削除
function deleteTaskResponse(id) {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();

  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return jsonResponse({ success: true });
}

// シート取得（なければ作成）
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // ヘッダー行を作成
    sheet.appendRow(['id', 'project', 'due', 'task', 'note', 'createdAt']);
    sheet.setFrozenRows(1);
    // 列幅調整
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 180);
    sheet.setColumnWidth(3, 100);
    sheet.setColumnWidth(4, 260);
    sheet.setColumnWidth(5, 260);
    sheet.setColumnWidth(6, 160);
  }
  return sheet;
}

// CORSヘッダー付きJSONレスポンス
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
