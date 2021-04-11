import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DepositAppService } from 'app/services/deposit-app.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'app/services/auth.service';

declare var $: any;
@Component({
  selector: 'app-delivery-invoice',
  templateUrl: './delivery-invoice.component.html',
  styleUrls: ['./delivery-invoice.component.css']
})
export class DeliveryInvoiceComponent implements OnInit {
  appId: any;
  uId: any;
  appdetails: any;
  loandetails: any;
  wDetails: any;
  dataRec: any;
  insDetails: any;
  dataToShow: any;
  isReadOnly: Boolean = true;
  farmerDetails: any;
  gotUserInfo: boolean = false;
  selectType: boolean = true;
  invoiceSummary: boolean = false;
  generateInvoiceBtnClicked: boolean = false;
  deliveryExists: boolean = false;
  advanceInvoiceExist: boolean = false;
  afterDelInvoiceExist: boolean = false;
  invoice: boolean = false;
  user: any;
  delivery: any;
  paymentType: any = '';
  storedFornumeberOfDays: any;
  genInvoices: any;
  invoiceCu: any;
  vars: any;
  gstType: any;
  totalAmount: any;
  sgstAmt: any;
  cgstAmt: any;
  igstAmt: any;
  totalGST: any;
  invoiceTypee: String = '';
  invRecFile: any;
  invRec: any;
  newDeliveryExist: Boolean = false;
  submitbtnClicked: Boolean = false;
  delLength: number = 0;
  invLen: number = 0;
  amtPaidByCst: number = 0;
  noOfBags: number = 1;
  btnClickable: Boolean = false;
  fumigation: Boolean = false;
  spraying: Boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private dservice: DepositAppService,
    private toastr: ToastrService,
    private auth: AuthService,
    private router: Router
  ) {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.appId = params['appId'];
      this.uId = params['uId'];
      if (this.appId) {
        this.getData();
        this.generatedInvoices();
        this.allVars();
        this.getProfile();
      }
    });
  }

  ngOnInit() {
  }

  allVars() {
    this.dservice.allvars(this.appId).subscribe(data => {
      console.log(data);
      if (data['success']) {
        this.vars = data['data']
      }
    })
  }

  getTotalAmount() {
    // console.log("Getting total amount")
    if (this.vars) {
      if (this.storedFornumeberOfDays && this.storedFornumeberOfDays != 0) {
        let _p = (this.vars.perBagRate * this.noOfBags * this.storedFornumeberOfDays * this.vars.perDayRate) + this.vars.insuranceSlab;
        if (this.fumigation) {
          _p = _p + this.vars.fumigation;
        }
        if (this.spraying) {
          _p = _p + this.vars.spraying;
        }
        if (this.gstType == 'cgst') {
          this.cgstAmt = _p * (9 / 100);
          this.sgstAmt = _p * (9 / 100);
          this.totalGST = this.sgstAmt + this.cgstAmt;
          this.totalAmount = _p + this.sgstAmt + this.cgstAmt;
          // console.log(this.totalAmount)
        } else {
          this.igstAmt = _p * (18 / 100);
          this.totalAmount = _p + this.igstAmt;
          this.totalGST = this.igstAmt;
          // console.log(this.totalAmount)
        }
      }
    } else {
      setTimeout(() => {
        this.getTotalAmount();
      }, 1000);
    }
  }

  generatedInvoices() {
    this.dservice.allInvoice(this.appId).subscribe(data => {
      console.log(data);
      if (data['success']) {
        this.genInvoices = data['data'];
        if (this.genInvoices.length) {
          if (this.genInvoices[0]['invoiceType'] == 'advance') {
            this.advanceInvoiceExist = true;
          }
          if (this.genInvoices[0]['invoiceType'] == 'afterDel') {
            this.afterDelInvoiceExist = true;
          }
          this.invLen = this.genInvoices.length;
          this.checkforNewDeliveryForNewInvoice()
        }
      }
    })
  }

  checkForGST() {
    if (this.wDetails.address.state === this.farmerDetails.address.state) {
      this.gstType = 'cgst'
    } else {
      this.gstType = 'igst'
    }
  }

  changeDetect() {
    if (this.storedFornumeberOfDays < 7) {
      this.storedFornumeberOfDays = 7;
      this.toastr.success('Minimum should be 7 days.')
    }
    this.getTotalAmount();
  }

  getData() {
    this.dservice.getDepositAppDetails(this.appId, this.uId).subscribe(
      (data) => {
        console.log(data);
        this.dataRec = true;
        if (data['success']) {
          this.appdetails = data['data'];
          this.loandetails = data['loan'];
          this.delivery = data['delivery'];
          this.dataToShow = data['data'];
          this.farmerDetails = data['user'];
          this.wDetails = data['wdetails'];
          this.insDetails = data['insD'];
          this.checkForGST();
          this.getTotalAmount();
          if (this.delivery.deliveryData.length) {
            this.deliveryExists = true;
            let _nd = this.delivery.deliveryData[this.delivery.deliveryData.length - 1]['timestamp']
            let _ld = this.appdetails['approvedTimestamp']
            this.storedFornumeberOfDays = this.getDaysCount(_ld, _nd);
            if (this.storedFornumeberOfDays == 0) {
              this.storedFornumeberOfDays = 1;
            }
            if (this.storedFornumeberOfDays) {
              this.noOfBags = this.delivery.deliveryData[this.delivery.deliveryData.length - 1]['noOfBags']
              this.getTotalAmount();
            }
            this.delLength = this.delivery.deliveryData.length;
            this.btnClickable = true;
            this.checkforNewDeliveryForNewInvoice();
          }
          this.btnClickable = true;

        } else {
          this.btnClickable = true;
          this.toastr.warning('Something went wrong');
        }
      },
      (err) => {
        // modal not needed
        // $('#error').modal('show')
        this.toastr.error('Error Occured. Please try again');
      }
    );
  }

  checkforNewDeliveryForNewInvoice() {
    console.log(this.delLength)
    console.log(this.invLen)
    if (this.invLen < this.delLength) {
      this.newDeliveryExist = true;
    }
  }

  getProfile() {
    this.auth.getProfile().subscribe(
      (profile) => {
        this.user = profile['user'];
        this.gotUserInfo = true;
        if (this.user['profileCompleted'] == 'false') {
          this.router.navigateByUrl('/completeprofile');
        } else {
          if (this.user['accountStatus'] == 'inactive') {
            this.router.navigateByUrl('/completeprofile');
          } else {
            console.log('All done');
          }
        }
      },
      (err) => {
        this.router.navigateByUrl('/login');
        this.toastr.error('Error occured. Please try again later.');
        this.gotUserInfo = false;
        console.log(err);
        return false;
      }
    );
  }

  changeStatus() {
    this.getTotalAmount();
  }
  changeStatusS() {
    this.getTotalAmount();
  }

  invoiceAfterDel() {
    if (this.advanceInvoiceExist) {
      this.toastr.warning('Advance Invoice Already Exists.')
      return;
    }
    if (!this.btnClickable) {
      this.toastr.warning('Loading... Please try again.');
      setTimeout(() => {
        this.invoiceAfterDel();
      }, 1000);
      return;
    }
    this.invoiceTypee = 'afterDel';
    this.invoiceSummary = true;
    this.selectType = false;
  }

  closeModal(val) {
    $('#' + val).modal('hide');
  }

  advanceInvoice() {
    if (this.afterDelInvoiceExist) {
      this.toastr.warning('After Delivery Invoice Already Exists.')
      return;
    }
    if (this.deliveryExists) {
      this.toastr.warning('Delivery Found. Please generate Invoice with other method.')
      return;
    }
    if (!this.btnClickable) {
      this.toastr.warning('Loading... Please try again.')
      setTimeout(() => {
        this.advanceInvoice();
      }, 1000);
      return;
    }
    this.invoiceTypee = 'advance';
    this.invoiceSummary = true;
    this.selectType = false;
  }
  getRemainingQty() {
    if (this.delivery) {
      return (this.appdetails['depositQty'] - this.delivery['totalQuantity'])
    } else {
      return this.appdetails.depositQty
    }
  }
  getRemainingBags() {
    if (this.delivery) {
      return (parseInt(this.appdetails['noOfBags']) - this.delivery['totalnumberOfbags'])
    } else {
      return this.appdetails.depositQty
    }
  }

  viewOldInvoice(val) {
    this.invoiceSummary = false;
    this.invoice = true;
    this.invoiceCu = val;
  }


  getDaysCount(fdate, ndate) {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const firstDate = new Date(fdate).valueOf();
    const secondDate = new Date(ndate).valueOf();

    const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
    return diffDays;
  }

  viewInvoice() {
    this.generateInvoiceBtnClicked = true;
    if (this.storedFornumeberOfDays == 0 || !this.storedFornumeberOfDays) {
      this.toastr.warning('Please enter number of days');
      this.generateInvoiceBtnClicked = false;
      return;
    }
    let _qty;
    let _bags;
    if (this.deliveryExists) {
      _qty = this.delivery.deliveryData[this.delivery.deliveryData.length - 1]['quantity']
      _bags = this.delivery.deliveryData[this.delivery.deliveryData.length - 1]['noOfBags']
    } else {
      _qty = this.appdetails['depositQty']
      _bags = this.appdetails['noOfBags']
    }
    let obj = {
      'depositId': this.appId,
      'quantity': _qty,
      'bags': _bags,
      'estimatedDaysofStorage': this.storedFornumeberOfDays,
      'invoiceType': this.invoiceTypee,
      'gstType': this.gstType,
      'gstAmount': this.totalGST,
      'totalAmount': this.totalAmount
    }
    if (this.fumigation) {
      obj['fumigation'] = true;
    }
    if (this.spraying) {
      obj['spraying'] = true;
    }
    this.dservice.newInvoice(obj).subscribe(data => {
      console.log(data);
      this.generateInvoiceBtnClicked = false;
      if (data['success']) {
        this.toastr.success('Invoice Generated');
        this.invoiceSummary = false;
        this.invoice = true;
        this.invoiceCu = data['data'];
      } else {
        this.toastr.error('Error occurred. Please try again later');
      }
    }, err => {
      console.log(err);
      this.generateInvoiceBtnClicked = false;
      this.toastr.error('Error occurred. Please try again later');
    })
  }

  uploadReceipt() {
    this.submitbtnClicked = true;
    if (!this.invRec) {
      this.toastr.warning('Please select receipt')
      this.submitbtnClicked = false;
      return;
    }
    if (!this.paymentType) {
      this.toastr.warning('Please select payment method.');
      this.submitbtnClicked = false;
      return;
    }

    let obj = {
      'id': this.invoiceCu._id,
      'amountPaidByCustomer': this.amtPaidByCst,
      'paymentMethod': this.paymentType
    }

    this.dservice.uploadReceiptAgainstInvoice(obj).subscribe(data => {
      console.log(data);
      this.submitbtnClicked = false;
      if (data['success']) {
        this.toastr.success('Receipt Upload Success.');
        window.location.reload();
      } else {
        this.toastr.error('Error occurred. Please try again later');
      }
    }, err => {
      console.log(err);
      this.submitbtnClicked = false;
      this.toastr.error('Error occurred. Please try again later');
    })
  }

  async changeListenerInvRec(event) {
    const [file] = event.target.files;
    if (!file) return;

    this.invRecFile = file;
    let fileSizeForinvRec = 1024 * 1024 * 10;
    if (!file.type.includes('pdf')) {
      this.toastr.error('Loan Documents must be a pdf type');
      return;
    } else if (file.size > fileSizeForinvRec) {
      this.toastr.error(`MAX size allowed is 10 MB`);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file); // read file as data url
    reader.onload = (event: any) => {
      this.invRec = event.target.result;
    };
  }

  uploadRecModal(val) {
    this.invoiceCu = val;
    $("#uploadRec").modal('show')
  }

  selectInvRec() {
    let elem: HTMLElement = document.getElementById('uploadInvRec');
    elem.click();
  }

  changeFileinvrec() {
    this.invRec = null;
    this.invRecFile = null;
  }

  printINvv() {
    window.print();
  }

  goback(){
    this.invoiceSummary = true;
    this.invoice = false;
  }

  getTotalAmountForDis(val){
    if(val.fumigation && val.spraying){
      return val.estimatedAmount - this.vars.fumigation - this.vars.spraying
    }
    if(!val.fumigation && !val.spraying){
      return val.estimatedAmount
    }
    if(val.fumigation && !val.spraying){
      return val.estimatedAmount - this.vars.fumigation
    }
    if(!val.fumigation && val.spraying){
      return val.estimatedAmount - this.vars.spraying
    }

  }

}

