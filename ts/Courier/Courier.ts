declare var _spPageContextInfo: any,
    _spFormDigestRefreshInterval: any,
    UpdateFormDigest: any,
    moment: any;
let parentDigest = "";
const siteUrl = _spPageContextInfo.webAbsoluteUrl;
const parentUrl = "https://egpafkenya.sharepoint.com/sites/egpafke";
let listUrl = "/_api/web/lists/getbytitle";
const mySentUrl =
    siteUrl +
    listUrl +
    "('Courier')/items?$select=PackageType,Project,Origin,Quantity,Destination," +
    "Description,SendingAdminStatus,Courier,CourierStatus,ReceivingAdminStatus,RecipientStatus," +
    "Recipient/Title&$expand=Recipient&$filter=AuthorId eq " +
    _spPageContextInfo.userId;
const myReceivedUrl =
    siteUrl +
    listUrl +
    "('Courier')/items?$select=PackageType,Project,Origin,Quantity,Destination," +
    "Description,SendingAdminStatus,Courier,CourierStatus,ReceivingAdminStatus,RecipientStatus," +
    "Author/Title&$expand=Author&$filter=RecipientId eq " +
    _spPageContextInfo.userId;
const courierurl = siteUrl + "/_api/web/lists/getbytitle('Courier')/items";

class Courier {
    Author: string;
    AuthorId: number;
    Recipient: string;
    RecipientId: string;
    Description: string;
    Destination: string;
    Origin: string;
    SendingAdminStatus: string;
    CourierStatus: string;
    ReceivingAdminStatus: string;
    RecipientStatus: string;
    SendingAdminDate: string;
    ReceivingAdminDate: string;
    CourierDate: string;
    RecipientDate: string;
    Courier: string;
    PackageType: string;
    Project: string;
    Location: string;
    Quantity: number;
    Admin = false;
  
    constructor() { }

    PostCourier(callback: any): number {
        let data: object = {
            __metadata: { type: "SP.Data.CourierListItem" },
            RecipientId: this.RecipientId,
            Description: this.Description,
            Destination: this.Destination,
            Origin: this.Origin,
            PackageType: this.PackageType,
            Project: this.Project,
            Quantity: this.Quantity,
        };
        Courier.prototype.PostJson(courierurl, data, callback);
        return 0;
    }

    PostJson(endpointUri: string, payload: object, success: any) {
        $.ajax({
            contentType: "application/json;odata=verbose",
            headers: {
                Accept: "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            },
            data: JSON.stringify(payload),
            error: Courier.prototype.OnError,
            success,
            type: "POST",
            url: endpointUri
        });
    }

    UpdateJson(Uri: string, payload: object, success: any) {
        $.ajax({
            url: Uri,
            type: "POST",
            data: JSON.stringify(payload),
            contentType: "application/json;odata=verbose",
            headers: {
                Accept: "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "X-HTTP-Method": "MERGE",
                "If-Match": "*"
            },
            success: success,
            error: Courier.prototype.OnError
        });
    }

    OnError(error: any) {
        UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
        swal("Error", error.responseText, "error");
    }

    RestCalls(u: string, f: any) {
        return $.ajax({
            url: u,
            method: "GET",
            headers: { Accept: "application/json; odata=verbose" },
            success: function (data) {
                f(data.d);
            },
            error: Courier.prototype.OnError,
        });
    }

    AllRequests(d: any) {
        let admin = false;
        if (d.results.length > 0) {
            admin = true;
            $("#sidebar .nav-item").removeClass("d-none");
            $.each(d.results, function (i, j) {
                Location = j.Location;
            });
        }
        const batchExecutor = new RestBatchExecutor(siteUrl, {
            "X-RequestDigest": $("#__REQUESTDIGEST").val()
        });
        let batchRequest = new BatchRequest();
        let commands: any[] = [];
        batchRequest.endpoint = mySentUrl;
        batchRequest.headers = { accept: "application/json;odata=nometadata" };
        commands.push({
            id: batchExecutor.loadRequest(batchRequest),
            title: "PopulateMySent"
        });
        batchRequest.endpoint = myReceivedUrl;
        batchRequest.headers = { accept: "application/json;odata=nometadata" };
        commands.push({
            id: batchExecutor.loadRequest(batchRequest),
            title: "PopulateMyReceived"
        });

        if (admin) {
            batchRequest.endpoint =
                courierurl +
                "?$select=Id,PackageType,Project,Origin,Destination," +
                "Description,SendingAdminStatus,Courier,CourierStatus,ReceivingAdminStatus,RecipientStatus," +
                "Recipient/Title,Author/Title,Quantity&$expand=Recipient,Author&$filter=Origin eq '" +
                Location +
                "'";
            batchRequest.headers = { accept: "application/json;odata=nometadata" };
            commands.push({
                id: batchExecutor.loadRequest(batchRequest),
                title: "PopulateAdminSend"
            });
            batchRequest.endpoint =
                courierurl +
                "?$select=Id,PackageType,Project,Origin,Destination," +
                "Description,SendingAdminStatus,Courier,CourierStatus,ReceivingAdminStatus,RecipientStatus," +
                "Recipient/Title,Author/Title,Quantity&$expand=Author,Recipient&$filter= Destination eq '" +
                Location +
                "'";
            batchRequest.headers = { accept: "application/json;odata=nometadata" };
            commands.push({
                id: batchExecutor.loadRequest(batchRequest),
                title: "PopulateReport"
            });
        }

        batchExecutor
            .executeAsync()
            .done(function (result: any) {
                $.each(result, function (k, v) {
                    let command = $.grep(commands, function (c: any) {
                        return v.id === c.id;
                    });
                    if (command[0].title === "PopulateMySent") {
                        Courier.prototype.PopulateMySent(v.result.result.value);
                    }
                    if (command[0].title === "PopulateMyReceived") {
                        Courier.prototype.PopulateMyReceived(v.result.result.value);
                    }
                    if (command[0].title === "PopulateAdminSend") {
                        Courier.prototype.PopulateAdminSend(v.result.result.value);
                    }
                    if (command[0].title === "PopulateReport") {
                        Courier.prototype.PopulateReport(v.result.result.value);
                    }
                });
            })
            .fail(function (err: any) {
                Courier.prototype.OnError(err);
            });
    }

    GetAllUsers() {
        const memberUrl =
            parentUrl +
            "/_api/web/sitegroups/getbyname('EGPAF Members')/users?$select=Title,Id";
        Courier.prototype.RestCalls(memberUrl, populateRecipient);
        function populateRecipient(d: any) {
            let content = "";
            if (d.results) {
                $.each(d.results, function (i, j) {
                    content += "<option value=" + j.Id + ">" + j.Title + "</option>";
                });
            }
            $("#recipient")
                .empty()
                .append(content)
                .chosen();
        }
    }

    GetParentDigest() {
        return $.ajax({
            url: parentUrl + "/_api/contextinfo",
            method: "POST",
            contentType: "application/json;odata=verbose",
            headers: {
                Accept: "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            }
        });
    }

    GetParentRequests() {
        const batchExecutor = new RestBatchExecutor(parentUrl, {
            "X-RequestDigest": parentDigest
        });
        let batchRequest = new BatchRequest();
        let commands: any[] = [];
        batchRequest.endpoint =
            parentUrl + listUrl + "('Location')/items?$select=Title";
        batchRequest.headers = { accept: "application/json;odata=nometadata" };
        commands.push({
            id: batchExecutor.loadRequest(batchRequest),
            title: "GetLocations"
        });

        batchRequest = new BatchRequest();
        batchRequest.endpoint =
            parentUrl + listUrl + "('Projects')/items?$select=Title";
        batchRequest.headers = { accept: "application/json;odata=nometadata" };
        commands.push({
            id: batchExecutor.loadRequest(batchRequest),
            title: "GetProjects"
        });
        batchExecutor
            .executeAsync()
            .done(function (result: any) {
                $.each(result, function (k, v) {
                    let command = $.grep(commands, function (c: any) {
                        return v.id === c.id;
                    });
                    if (command[0].title === "GetLocations") {
                        Courier.prototype.PopulateLocations(v.result.result.value);
                    }
                    if (command[0].title === "GetProjects") {
                        Courier.prototype.PopulateProjects(v.result.result.value);
                    }
                });
            })
            .fail(function (err: any) {
                Courier.prototype.OnError(err);
            });
    }

    GetCurrentParcelLocation(courierdata: Courier): string {
        let parcelStatus = "Not Sent";

        if (courierdata.SendingAdminStatus === "Received") {
            parcelStatus = `Office Admin (${courierdata.Origin})`;
        }

        if (courierdata.CourierStatus === "Received") {
            parcelStatus = courierdata.Courier;
        }

        if (courierdata.SendingAdminStatus === "Received") {
            parcelStatus = `Office Admin (${courierdata.Destination})`;
        }

        if (courierdata.RecipientStatus === "Received") {
            parcelStatus = `Received By ${courierdata.Recipient}`;
        }

        return parcelStatus;
    }

    PrepSendForm() {
        $("#sender").val(_spPageContextInfo.userDisplayName);
        $("#packagetype").chosen();
        $("#datepicker,#rdatepicker,#office2datepicker").datetimepicker({
            format: "DD-MM-YYYY"
        });
        $("#sendersubmit").click(function () {
            $("#courierform")
                .data("formValidation")
                .validate();
        });
        Courier.prototype.ValidateCourier();
    }

    SendFormData() {
        let courier = new Courier();
        courier.PackageType = $("#packagetype").val();
        courier.Project = $("#project").val();
        courier.Destination = $("#destination").val();
        courier.RecipientId = $("#recipient").val();
        courier.Origin = $("#origin").val();
        courier.Description = $("#description").val();
        courier.Quantity = $("#quantity").val();
        courier.PostCourier(function () {
            swal({
                title: "Success!",
                text: "Courier request submitted successfully",
                icon: "success"
            }).then(() => {
                $("#courierform input:not(:disabled),#courierform textarea").val("");
            });
        });
    }

    ValidateCourier() {
        $("#courierform")
            .formValidation({
                framework: "bootstrap",
                icon: {
                    valid: "fa fa-check",
                    invalid: "fa fa-times",
                    validating: "fa fa-refresh",
                },
                fields: {
                    package: {
                        row: ".col-xs-4",
                        validators: {
                            notEmpty: {
                                message: "The package is required",
                            },
                        },
                    },
                    sender: {
                        row: ".col-xs-4",
                        validators: {
                            notEmpty: {
                                message: "The sender is required"
                            },
                        },
                    },
                    description: {
                        row: ".col-xs-4",
                        validators: {
                            notEmpty: {
                                message: "The description is required"
                            },
                        },
                    },
                    destination: {
                        row: ".col-xs-4",
                        validators: {
                            notEmpty: {
                                message: "The destination is required"
                            },
                        },
                    },
                    recipient: {
                        row: ".col-xs-4",
                        validators: {
                            notEmpty: {
                                message: "The recipient is required"
                            },
                        },
                    },
                    origin: {
                        row: ".col-xs-4",
                        validators: {
                            notEmpty: {
                                message: "The origin is required"
                            },
                        },
                    },
                    project: {
                        row: ".col-xs-4",
                        validators: {
                            notEmpty: {
                                message: "The Project is required"
                            },
                        },
                    },
                },
            })
            .on("success.form.fv", function (e: any) {
                e.preventDefault();
                Courier.prototype.SendFormData();
            });
        $("#officeadmin").formValidation({
            framework: "bootstrap",
            icon: {
                valid: "fa fa-check",
                invalid: "fa fa-times",
                validating: "fa fa-refresh"
            },
            fields: {
                office_package: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The package is required"
                        }
                    }
                },
                office_sender: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The sender is required"
                        }
                    }
                },
                office_description: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The description is required"
                        }
                    }
                },
                office_transittype: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Transit Type is required"
                        }
                    }
                },
                rwaybillno: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Waybill Number is required"
                        }
                    }
                },
                office_destination: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The destination is required"
                        }
                    }
                },
                office_recipient: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The recipient is required"
                        }
                    }
                },
                office_location: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The location is required",
                        }
                    }
                },
                office_project: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Project is required"
                        }
                    }
                },
                rproducttype: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Product Type is required"
                        }
                    }
                },
                office_weight: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Weight is required"
                        }
                    }
                },
                office_date: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Date is required",
                        }
                    },
                },
            },
        });
        $("#officeadmin2").formValidation({
            framework: "bootstrap",
            icon: {
                valid: "fa fa-check",
                invalid: "fa fa-times",
                validating: "fa fa-refresh",
            },
            fields: {
                office2_package: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The package is required"
                        },
                    },
                },
                office2_sender: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The sender is required"
                        }
                    },
                },
                office2_description: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The description is required"
                        }
                    },
                },
                office2_transittype: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Transit Type is required"
                        }
                    },
                },
                office2_waybillno: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Waybill Number is required"
                        }
                    },
                },
                office2_destination: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The destination is required"
                        }
                    },
                },
                office2_recipient: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The recipient is required"
                        }
                    },
                },
                office2_location: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The location is required"
                        }
                    },
                },
                office2_project: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Project is required"
                        }
                    },
                },
                office2_producttype: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Product Type is required"
                        }
                    },
                },
                office2_weight: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Weight is required"
                        }
                    },
                },
                office2_date: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Date is required"
                        }
                    },
                },
            },
        });
        $("#receivertab").formValidation({
            framework: "bootstrap",
            icon: {
                valid: "fa fa-check",
                invalid: "fa fa-times",
                validating: "fa fa-refresh",
            },
            fields: {
                rpackage: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The package is required"
                        }
                    },
                },
                rsender: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The sender is required"
                        }
                    },
                },
                rdescription: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The description is required"
                        }
                    },
                },
                rtransittype: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Transit Type is required"
                        }
                    },
                },
                r_waybillno: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Waybill Number is required"
                        }
                    },
                },
                rdestination: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The destination is required"
                        }
                    },
                },
                rrecipient: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The recipient is required"
                        }
                    },
                },
                rlocation: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The location is required"
                        }
                    },
                },
                rproject: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Project is required"
                        }
                    },
                },
                rproducttype: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Product Type is required"
                        }
                    },
                },
                rweight: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Weight is required"
                        }
                    },
                },
                rdate: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Date is required"
                        }
                    },
                },
            },
        });
    }

    PopulateLocations(d: any) {
        let content = "";
        $.each(d, function (i, j) {
            content += "<option>" + j.Title + "</option>";
        });
        $("#origin,#destination")
            .empty()
            .append(content)
            .chosen();
    }

    PopulateProjects(d: any) {
        let content = "";
        $.each(d, function (i, j) {
            content += "<option>" + j.Title + "</option>";
        });
        $("#project")
            .empty()
            .append(content)
            .chosen();
    }

    PopulateMySent(d: any) {
        let tableRow = "";
        $.each(d, function (key, val) {
            let parcelLocation = Courier.prototype.GetCurrentParcelLocation(val);
            tableRow += `<tr><td> ${val.PackageType} </td><td> ${val.Quantity} </td><td> ${
                val.Project
                } </td><td> ${val.Origin} </td><td> ${val.Recipient.Title} </td><td> ${
                val.Destination
                }</td><td> ${val.Description} </td><td> ${parcelLocation} </td></tr>`;
        });
        $("#sentTable>tbody").html(tableRow);
        $("#sentTable").DataTable({ responsive: true });
    }

    PopulateMyReceived(d: any) {
        let tableRow = "";
        $.each(d, function (key, val) {
            let parcelLocation = Courier.prototype.GetCurrentParcelLocation(val);
            tableRow += `<tr><td> ${val.PackageType} </td><td> ${val.Quantity} </td><td> ${
                val.Project
                } </td><td> ${val.Author.Title} </td><td> ${val.Origin} </td><td> ${
                val.Destination
                }</td><td> ${val.Description} </td><td> ${parcelLocation} </td></tr>`;
        });
        $("#receivedTable>tbody").html(tableRow);
        tableRow = "";
        $("#receivedTable").DataTable({ responsive: true });
    }

    PopulateAdminReceived(d: any) {
        let tableRow = "";
        $.each(d, function (key, val) {
            if (val.CourierStatus === "Received" && val.RecipientStatus === "Pending") {
                let btnAcknowledge = "<a href=\"#\" data-id=\"" + val.Id +
                    "\" data-from=\"" + val.Author.Title + "\" class=\"btn btn-acknowledge btn-primary\">Acknowledge</a>";
                if (val.SendingAdminStatus === "Received") {
                    btnAcknowledge = "Received on " + moment(val.ReceivingAdminDate).format("DD/MM/YYYY");
                }
                tableRow += `<tr><td>${val.PackageType}</td><td>${val.Quantity}</td>
                        <td>${val.Author.Title}</td><td> ${
                    val.Recipient.Title
                    } </td><td> ${val.Origin} </td><td> ${
                    val.Description
                    } </td><td> ${val.Project} </td>
                        <td>${val.Courier}</td>
                        <td>${btnAcknowledge}</td>
                        <td><a href="#" data-id="${
                    val.Id
                    }" data-from="${val.Recipient.Title}" class="btn btn-assign btn-primary">Assign</a></td>
                        </tr>`;
            }
        });

        $("#adminreceivetable>tbody").html(tableRow);
        tableRow = "";
        $("#adminreceivetable").DataTable({ responsive: true });
    }
    PopulateAdminSend(d: any) {
        let tableRow = "";
        $.each(d, function (key, val) {
            if (d.length > 0) {
                let btnAssign = `<a href="#" data-id="${
                    val.Id
                    }" data-from="${val.Author.Title}" class="btn btn-acknowledge btn-primary">Acknowledge</a>`;
                if (val.SendingAdminStatus === "Received") {
                    btnAssign = `Received on ${moment(val.RecipientDate).format(
                        "DD/MM/YYYY",
                    )}`;
                }
                tableRow += `<tr><td> ${val.PackageType} </td><td> ${val.Quantity} </td>
                        <td> ${val.Author.Title} </td><td> ${
                    val.Recipient.Title
                    } </td><td> ${val.Destination}</td><td> ${
                    val.Description
                    } </td><td> ${val.Project} </td>
        <td>${btnAssign}</td>
        <td><a href="#" data-id="${
                    val.Id
                    }" class="btn btn-assign btn-primary">Assign</a></td>
        </tr>`;
            }
        });

        $("#adminsendtable>tbody").html(tableRow);
        tableRow = "";
        $("#adminsendtable").DataTable({ responsive: true });
    }

    PopulateReport(d: any) {
        console.log(d);
        let tableRow = "";
        if (d.length > 0) {
            Courier.prototype.PopulateAdminReceived(d);
            $.each(d, function (key, val) {
                let courier = "";
                if (val.Courier) { courier = val.Courier; }
                let parcelLocation = Courier.prototype.GetCurrentParcelLocation(val);
                tableRow += `<tr><td> ${val.PackageType} </td><td> ${val.Quantity} </td><td> ${val.Project}</td>
                <td> ${val.Author.Title} </td><td> ${val.Recipient.Title} </td>
                <td> ${val.Origin}</td><td> ${val.Destination}</td>
                <td> ${parcelLocation} </td><td><a href="#" class="btn btn-primary btn-view" data-id="${val.Id}">View</a></td></tr>`;
            });
        }
        $("#reportsTable>tbody").html(tableRow);
        tableRow = "";
        $("#reportsTable").DataTable({
            responsive: true,
            initComplete: function () {
                let cols = [0, 2, 3, 4, 5, 6, 7];
                for (let i = 0; i < cols.length; i++) {
                    this.api().column(cols[i]).every(function () {
                        let column = this;
                        let select = $('<select class="select"><option value=""></option></select>')
                            .appendTo($(column.footer()).empty()).on("change", function () {
                                let val = $.fn.dataTable.util.escapeRegex($(this).val());
                                column.search(val ? "^" + val + "$" : "", true, false).draw();
                            });
                        column.data().unique().sort()
                            .each(function (k: any, v: any) {
                                select.append('<option value="' + k + '">' + k + "</option>");
                            });
                    });
                }
            },
        });
    }

    GetIsApprover() {
        const approverUrl =
            siteUrl +
            listUrl +
            "('Approvers')/items?$select=Location&$AdminId eq " +
            _spPageContextInfo.userId;
        Courier.prototype.RestCalls(approverUrl, Courier.prototype.AllRequests);
    }

    AcknowledgeReceiptFromUser(id: number, from: string) {
        swal({
            title: "Are you sure?",
            text: "You are about to accept the package from " + from,
            icon: "warning",
            buttons: true,
        }).then((result: boolean) => {
            if (result) {
                ReceiveParcelFromUser();
            }
        });

        function ReceiveParcelFromUser() {
            let item = {
                __metadata: { type: "SP.Data.CourierListItem" },
                SendingAdminStatus: "Received",
                SendingAdminDate: moment().toISOString(),
            };
            Courier.prototype.UpdateJson(courierurl + "(" + id + ")", item, success);
            function success() {
                swal({
                    title: "success",
                    text: "Package received Successfully",
                    icon: "success",
                }).then((result: any) => {
                    location.reload();
                });
            }
        }
    }

    AcknowledgeReceiptFromCourier(id: number, from: string) {
        swal({
            title: "Are you sure?",
            text: "You are about to accept the package from " + from,
            icon: "warning",
            buttons: true,
        }).then((result: boolean) => {
            if (result) {
                ReceiveFromCourier();
            }
        });

        function ReceiveFromCourier() {
            let item = {
                __metadata: { type: "SP.Data.CourierListItem" },
                ReceivingAdminStatus: "Received",
                ReceivingAdminDate: moment().toISOString(),
            };
            Courier.prototype.UpdateJson(courierurl + "(" + id + ")", item, success);
            function success() {
                swal({
                    title: "Success",
                    text: "Package received Successfully",
                    icon: "success",
                }).then((result: any) => {
                    location.reload();
                });
            }
        }
    }

    GetPackage(id: number) {
        let packageUrl =
            courierurl +
            "?$select=PackageType,Project,Origin,Destination,WayBillNo,Weight,Quantity," +
            "Description,Courier,Author/Title," +
            "Recipient/Title&$expand=Recipient,Author&$filter=Id eq " +
            id;
        Courier.prototype.RestCalls(packageUrl, PopulateSendModal);
        $("#adminModal").modal();
        $("#hidden-id").val(id);
        function PopulateSendModal(d: any) {
            if (d.results.length > 0) {
                $.each(d.results, function (i, j) {
                    $(".packagetype").text(j.PackageType);
                    $(".project").text(j.Project);
                    $(".quantity").text(j.Quantity);
                    $(".sender").text(j.Author.Title);
                    $(".recipient").text(j.Recipient.Title);
                    $(".senderLocation").text(j.Origin);
                    $(".receiverLocation").text(j.Destination);
                    $(".description").text(j.Description);
                    if (j.Courier) {
                        $("#vehicletype").val(j.Courier);
                        $("#waybillNo").val(j.WayBillNo);
                        $("#weightModal").val(j.Weight);
                        $("#vehicletype,#waybillNo,#weightModal").prop("disabled", true);
                        $("#btn-send-courier").hide();
                    }
                });
            }
        }
    }


    GiveRecipient(id: number, from: string) {
        swal({
            title: "Are you sure?",
            text: "You are about to hand over the package to " + from,
            icon: "warning",
            buttons: true,
        }).then((result: boolean) => {
            if (result) {
                GivePackageRecipient();
            }
        });

        function GivePackageRecipient() {
            let item = {
                __metadata: { type: "SP.Data.CourierListItem" },
                RecipientStatus: "Approved",
                RecipientDate: moment().toISOString(),
            };
            Courier.prototype.UpdateJson(courierurl + "(" + id + ")", item, success);
            function success() {
                swal({
                    title: "Success",
                    text: "Package passed to recipient successfully",
                    icon: "success",
                }).then((result: any) => {
                    location.reload();
                });
            }
        }
    }

    AssignPackage() {
        let item = {
            __metadata: { type: "SP.Data.CourierListItem" },
            Courier: $("#vehicletype").val(),
            CourierStatus: "Received",
            Weight: $("#weightModal").val(),
            WayBillNo: $("#waybillNo").val(),
            CourierDate: moment().toISOString(),
        };
        Courier.prototype.UpdateJson(
            courierurl + "(" + $("#hidden-id").val() + ")",
            item,
            success,
        );
        function success() {
            swal({
                title: "Success",
                text: "Package sent successfully",
                icon: "success",
            }).then((result: any) => {
                location.reload();
            });
        }
    }

}
$(document).ready(function () {
    let courier = new Courier();
    courier.PrepSendForm();
    courier.GetParentDigest().then(function (d) {
        parentDigest = d.d.GetContextWebInformation.FormDigestValue;
        courier.GetParentRequests();
    });
    courier.GetAllUsers();
    courier.GetIsApprover();
    $("#adminsendtable").on("click", ".btn-acknowledge", function () {
        let id = $(this).data("id");
        let from = $(this).data("from");
        courier.AcknowledgeReceiptFromUser(id, from);
    });
    $("#adminreceivetable").on("click", ".btn-acknowledge", function () {
        let id = $(this).data("id");
        let from = $(this).data("from");
        courier.AcknowledgeReceiptFromCourier(id, from);
    });
    $("#adminsendtable").on("click", ".btn-assign", function () {
        let id = $(this).data("id");
        courier.GetPackage(id);
    });

    $("#adminreceivetable").on("click", ".btn-assign", function () {
        let id = $(this).data("id");
        let from = $(this).data("from");
        courier.GiveRecipient(id, from);
    });

    $("#btn-send-courier").click(function () {
        courier.AssignPackage();
    });

    $("#reportsTable").on("click", ".btn-view", function () {
        let id = $(this).data("id");
        courier.GetPackage(id);
    });

});
