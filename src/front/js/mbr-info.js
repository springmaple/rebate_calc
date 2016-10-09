const {ipcRenderer} = require('electron')
const {getParamByName, floatToString} = require('./../../lib/util.js')
const _id = getParamByName('_id', window.location.href)
const map = {
  mbrName: 'mbr-name',
  mbrId: 'mbr-id',
  mbrHp: 'mbr-hp', 
  mbrIc: 'mbr-ic', 
  mbrEmail: 'mbr-email',
  mbrBankName: 'mbr-bank-name',
  mbrBankAcc: 'mbr-bank-acc',
  mbrJoinDate: 'mbr-join-date',
  mbrPackage: 'mbr-package',
  mbrRemark: 'mbr-remark'
}

var _mbr = null
var _init = true


function rmErr () {
  $('#form-error').html('')
}

function prevalidate () {
  let mbrName = $('#mbr-name')
  let mbrNameVal = mbrName.val().trim()
  mbrName.val(mbrNameVal)
  if (mbrNameVal.length == 0) {
    $('#form-error').html(`
      <div class="alert alert-danger">
        <a href="javascript:rmErr()" class="close" 
          aria-label="close">&times;</a>
        Member name must not be empty.
      </div>`)
    mbrName.focus()
    return false
  }

  let mbrPackage = $('#mbr-package') 
  mbrPackage.val(floatToString(mbrPackage.val()))
  return true
}

function getMbrChange () {
  let mbr_ = {}
  for (let key in map) {
    let value = $(`#${map[key]}`).val() 
    if (_mbr == null || value != _mbr[key])
      mbr_[key] = value
  }
  return mbr_
}

function addMbr () {
  if (!prevalidate()) return false

  let mbrToIns = {}
  for (let key in map)
    mbrToIns[key] = $(`#${map[key]}`).val()
  ipcRenderer.send('add-mbr', mbrToIns)
}

function updMbr () {
  if (!prevalidate()) return false
  
  let mbrToUpd = getMbrChange()
  if (!$.isEmptyObject(mbrToUpd)) {
    ipcRenderer.send('upd-mbr', { _id: _id, mbr: mbrToUpd })
  }
}

function delMbr () {
  if (confirm("Press OK to confirm delete member.")) {
    ipcRenderer.send('del-mbr', _id)
  }
}

function cnlUpdMbr () {
  let mbr_ = getMbrChange()
  if ($.isEmptyObject(mbr_) || 
      confirm("Unsaved changes will be lost, confirm to cancel?")) {
    window.close()
  }
}

ipcRenderer.on('mbr', function (evt, mbr) {
  if (!_id || mbr._rmDate) {
    window.close()
    return
  }

  _mbr = mbr
  for (let key in map) {
    $(`#${map[key]}`).val(mbr[key]) 
  }

  if (!_init) {
    let mbrUpdateStatus = $('#mbr-update-status')
    mbrUpdateStatus.show()
    setTimeout(function () {
      mbrUpdateStatus.fadeOut('fast');
    }, 1000)
  } else {
    _init = false  
  }
})

window.onload = function () {
  let mbrInfoElementMap = [
    {label: 'Name', id: 'mbr-name', type: 'text', ph: 'Enter name'},
    {label: 'ID', id: 'mbr-id', type: 'text', ph: 'Enter id'},
    {label: 'Hp No', id: 'mbr-hp', type: 'text', ph: 'Enter hp no'},
    {label: 'IC', id: 'mbr-ic', type: 'text', ph: 'Enter ic'},
    {label: 'Email', id: 'mbr-email', type: 'text', ph: 'Enter email'},
    {label: 'Bank Name', id: 'mbr-bank-name', type: 'text', 
      ph: 'Enter bank name'},
    {label: 'Bank Acc', id: 'mbr-bank-acc', type: 'text', 
      ph: 'Enter bank acc'},
    {label: 'Join Date', id: 'mbr-join-date', type: 'text', 
      ph: 'Enter join date'},
    {label: 'Package', id: 'mbr-package', type: 'number', ph: 'Enter package'}
  ]
  let mbrInfoCtnt = ''
  
  for (let {label, id, type, ph} of mbrInfoElementMap) {
    mbrInfoCtnt += `
      <div class="form-group">
        <label class="control-label col-sm-2" for="${id}">${label}:</label>
        <div class="col-sm-10">
          <input type="${type}" class="form-control" id="${id}" 
            placeholder="${ph}">
        </div>
      </div>`
  }
  mbrInfoCtnt += `
    <div class="form-group">
      <label class="control-label col-sm-2" for="mbr-remark">Remark:</label>
      <div class="col-sm-10">
        <textarea class="form-control" id="mbr-remark" rows="2" 
          placeholder="Enter remark"></textarea>
      </div>
    </div>`

  let btnHtml = null
  if (_id) {
    btnHtml = `
      <div>
        <span>
          <button onclick="updMbr()" class="btn btn-primary">Update</button>
          <button onclick="cnlUpdMbr()" class="btn btn-default">Cancel</button>
          <span id="mbr-update-status">Changes saved!</span>
        </span>
        <span style="float: right">
          <button onclick="delMbr()" class="btn btn-danger">Delete</button>
        </span>
      </div>`
  } else {
    btnHtml = `
      <button onclick="addMbr()" class="btn btn-primary">Create Member</button>
      <button onclick="cnlUpdMbr()" class="btn btn-default">Cancel</button>`
  }

  mbrInfoCtnt += `
    <div class="form-group">
      <div class="col-sm-offset-2 col-sm-10">
        ${btnHtml}
      </div>
    </div>`

  let mbrPackage = $('#mbr-package') 
  mbrPackage.focusout(evt => {
    mbrPackage.val(floatToString(mbrPackage.val(), 2))
  })

  let mbrName = $('#mbr-name') 
  mbrName.focusout(evt => {
    if (mbrName.val().length > 0) rmErr()
  })

  if (_id) {
    ipcRenderer.send('get-mbr', _id)

    $('#mbr-navibar').html(`
      <ul class="nav nav-tabs nav-justified">
        <li class="active"><a href="#">Info</a></li>
        <li><a href="mbr-rebate.html?_id=${_id}">Calculator</a></li>
      </ul>`)
  }
  $('#rebate-mbr-info').html(mbrInfoCtnt)
}