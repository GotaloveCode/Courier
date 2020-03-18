var parentDigest = "";
var siteUrl = _spPageContextInfo.webAbsoluteUrl;
var parentUrl = "https://egpafkenya.sharepoint.com/sites/egpafke";
var listUrl = "/_api/web/lists/getbytitle";
var mySentUrl = siteUrl +
    listUrl +
    "('Courier')/items?$select=PackageType,Project,Origin,Quantity,Destination," +
    "Description,SendingAdminStatus,Courier,CourierStatus,ReceivingAdminStatus,RecipientStatus," +
    "Recipient/Title&$expand=Recipient&$filter=AuthorId eq " +
    _spPageContextInfo.userId;
var myReceivedUrl = siteUrl +
    listUrl +
    "('Courier')/items?$select=PackageType,Project,Origin,Quantity,Destination," +
    "Description,SendingAdminStatus,Courier,CourierStatus,ReceivingAdminStatus,RecipientStatus," +
    "Author/Title&$expand=Author&$filter=RecipientId eq " +
    _spPageContextInfo.userId;
var courierurl = siteUrl + "/_api/web/lists/getbytitle('Courier')/items";
var Courier = (function () {
    function Courier() {
        this.Admin = false;
    }
    Courier.prototype.PostCourier = function (callback) {
        var data = {
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
    };
    Courier.prototype.PostJson = function (endpointUri, payload, success) {
        $.ajax({
            contentType: "application/json;odata=verbose",
            headers: {
                Accept: "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            },
            data: JSON.stringify(payload),
            error: Courier.prototype.OnError,
            success: success,
            type: "POST",
            url: endpointUri
        });
    };
    Courier.prototype.UpdateJson = function (Uri, payload, success) {
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
    };
    Courier.prototype.OnError = function (error) {
        UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
        swal("Error", error.responseText, "error");
    };
    Courier.prototype.RestCalls = function (u, f) {
        return $.ajax({
            url: u,
            method: "GET",
            headers: { Accept: "application/json; odata=verbose" },
            success: function (data) {
                f(data.d);
            },
            error: Courier.prototype.OnError,
        });
    };
    Courier.prototype.AllRequests = function (d) {
        var admin = false;
        if (d.results.length > 0) {
            admin = true;
            $("#sidebar .nav-item").removeClass("d-none");
            $.each(d.results, function (i, j) {
                Location = j.Location;
            });
        }
        var batchExecutor = new RestBatchExecutor(siteUrl, {
            "X-RequestDigest": $("#__REQUESTDIGEST").val()
        });
        var batchRequest = new BatchRequest();
        var commands = [];
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
            .done(function (result) {
            $.each(result, function (k, v) {
                var command = $.grep(commands, function (c) {
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
            .fail(function (err) {
            Courier.prototype.OnError(err);
        });
    };
    Courier.prototype.GetAllUsers = function () {
        var memberUrl = parentUrl +
            "/_api/web/sitegroups/getbyname('EGPAF Members')/users?$select=Title,Id";
        Courier.prototype.RestCalls(memberUrl, populateRecipient);
        function populateRecipient(d) {
            var content = "<option value=' '></option>";
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
    };
    Courier.prototype.GetParentDigest = function () {
        return $.ajax({
            url: parentUrl + "/_api/contextinfo",
            method: "POST",
            contentType: "application/json;odata=verbose",
            headers: {
                Accept: "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            }
        });
    };
    Courier.prototype.GetParentRequests = function () {
        var batchExecutor = new RestBatchExecutor(parentUrl, {
            "X-RequestDigest": parentDigest
        });
        var batchRequest = new BatchRequest();
        var commands = [];
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
            .done(function (result) {
            $.each(result, function (k, v) {
                var command = $.grep(commands, function (c) {
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
            .fail(function (err) {
            Courier.prototype.OnError(err);
        });
    };
    Courier.prototype.GetCurrentParcelLocation = function (courierdata) {
        var parcelStatus = "Not Sent";
        if (courierdata.SendingAdminStatus === "Received") {
            parcelStatus = "Office Admin (" + courierdata.Origin + ")";
        }
        if (courierdata.CourierStatus === "Received") {
            parcelStatus = courierdata.Courier;
        }
        if (courierdata.SendingAdminStatus === "Received") {
            parcelStatus = "Office Admin (" + courierdata.Destination + ")";
        }
        if (courierdata.RecipientStatus === "Received") {
            parcelStatus = "Received By " + courierdata.Recipient;
        }
        return parcelStatus;
    };
    Courier.prototype.PrepSendForm = function () {
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
    };
    Courier.prototype.SendFormData = function () {
        var courier = new Courier();
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
            }).then(function () {
                $("#courierform input:not(:disabled),#courierform textarea").val("");
            });
        });
    };
    Courier.prototype.ValidateCourier = function () {
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
                    validators: {
                        notEmpty: {
                            message: "The package is required",
                        },
                    },
                },
                sender: {
                    validators: {
                        notEmpty: {
                            message: "The sender is required"
                        },
                    },
                },
                description: {
                    validators: {
                        notEmpty: {
                            message: "The description is required"
                        },
                    },
                },
                destination: {
                    validators: {
                        notEmpty: {
                            message: "The destination is required"
                        },
                    },
                },
                recipient: {
                    validators: {
                        notEmpty: {
                            message: "The recipient is required"
                        },
                    },
                },
                origin: {
                    validators: {
                        notEmpty: {
                            message: "The origin is required"
                        },
                    },
                },
                project: {
                    validators: {
                        notEmpty: {
                            message: "The Project is required"
                        },
                    },
                },
            },
        })
            .on("success.form.fv", function (e) {
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
    };
    Courier.prototype.PopulateLocations = function (d) {
        var content = "<option val=' '></option>";
        $.each(d, function (i, j) {
            content += "<option val='" + j.Title + "'>" + j.Title + "</option>";
        });
        $("#origin,#destination")
            .empty()
            .append(content)
            .chosen();
    };
    Courier.prototype.PopulateProjects = function (d) {
        var content = "<option val=' '></option>";
        $.each(d, function (i, j) {
            content += "<option val='" + j.Title + "'>" + j.Title + "</option>";
        });
        $("#project")
            .empty()
            .append(content)
            .chosen();
    };
    Courier.prototype.PopulateMySent = function (d) {
        var tableRow = "";
        $.each(d, function (key, val) {
            var parcelLocation = Courier.prototype.GetCurrentParcelLocation(val);
            tableRow += "<tr><td> " + val.PackageType + " </td><td> " + val.Quantity + " </td><td> " + val.Project + " </td><td> " + val.Origin + " </td><td> " + val.Recipient.Title + " </td><td> " + val.Destination + "</td><td> " + val.Description + " </td><td> " + parcelLocation + " </td></tr>";
        });
        $("#sentTable>tbody").html(tableRow);
        $("#sentTable").DataTable({ responsive: true });
    };
    Courier.prototype.PopulateMyReceived = function (d) {
        var tableRow = "";
        $.each(d, function (key, val) {
            var parcelLocation = Courier.prototype.GetCurrentParcelLocation(val);
            tableRow += "<tr><td> " + val.PackageType + " </td><td> " + val.Quantity + " </td><td> " + val.Project + " </td><td> " + val.Author.Title + " </td><td> " + val.Origin + " </td><td> " + val.Destination + "</td><td> " + val.Description + " </td><td> " + parcelLocation + " </td></tr>";
        });
        $("#receivedTable>tbody").html(tableRow);
        tableRow = "";
        $("#receivedTable").DataTable({ responsive: true });
    };
    Courier.prototype.PopulateAdminReceived = function (d) {
        var tableRow = "";
        $.each(d, function (key, val) {
            if (val.CourierStatus === "Received" && val.RecipientStatus === "Pending") {
                var btnAcknowledge = "<a href=\"#\" data-id=\"" + val.Id +
                    "\" data-from=\"" + val.Author.Title + "\" class=\"btn btn-acknowledge btn-primary\">Acknowledge</a>";
                if (val.SendingAdminStatus === "Received") {
                    btnAcknowledge = "Received on " + moment(val.ReceivingAdminDate).format("DD/MM/YYYY");
                }
                tableRow += "<tr><td>" + val.PackageType + "</td><td>" + val.Quantity + "</td>\n                        <td>" + val.Author.Title + "</td><td> " + val.Recipient.Title + " </td><td> " + val.Origin + " </td><td> " + val.Description + " </td><td> " + val.Project + " </td>\n                        <td>" + val.Courier + "</td>\n                        <td>" + btnAcknowledge + "</td>\n                        <td><a href=\"#\" data-id=\"" + val.Id + "\" data-from=\"" + val.Recipient.Title + "\" class=\"btn btn-assign btn-primary\">Assign</a></td>\n                        </tr>";
            }
        });
        $("#adminreceivetable>tbody").html(tableRow);
        tableRow = "";
        $("#adminreceivetable").DataTable({ responsive: true });
    };
    Courier.prototype.PopulateAdminSend = function (d) {
        var tableRow = "";
        $.each(d, function (key, val) {
            if (d.length > 0) {
                var btnAssign = "<a href=\"#\" data-id=\"" + val.Id + "\" data-from=\"" + val.Author.Title + "\" class=\"btn btn-acknowledge btn-primary\">Acknowledge</a>";
                if (val.SendingAdminStatus === "Received") {
                    btnAssign = "Received on " + moment(val.RecipientDate).format("DD/MM/YYYY");
                }
                tableRow += "<tr><td> " + val.PackageType + " </td><td> " + val.Quantity + " </td>\n                        <td> " + val.Author.Title + " </td><td> " + val.Recipient.Title + " </td><td> " + val.Destination + "</td><td> " + val.Description + " </td><td> " + val.Project + " </td>\n        <td>" + btnAssign + "</td>\n        <td><a href=\"#\" data-id=\"" + val.Id + "\" class=\"btn btn-assign btn-primary\">Assign</a></td>\n        </tr>";
            }
        });
        $("#adminsendtable>tbody").html(tableRow);
        tableRow = "";
        $("#adminsendtable").DataTable({ responsive: true });
    };
    Courier.prototype.PopulateReport = function (d) {
        console.log(d);
        var tableRow = "";
        if (d.length > 0) {
            Courier.prototype.PopulateAdminReceived(d);
            $.each(d, function (key, val) {
                var courier = "";
                if (val.Courier) {
                    courier = val.Courier;
                }
                var parcelLocation = Courier.prototype.GetCurrentParcelLocation(val);
                tableRow += "<tr><td> " + val.PackageType + " </td><td> " + val.Quantity + " </td><td> " + val.Project + "</td>\n                <td> " + val.Author.Title + " </td><td> " + val.Recipient.Title + " </td>\n                <td> " + val.Origin + "</td><td> " + val.Destination + "</td>\n                <td> " + parcelLocation + " </td><td><a href=\"#\" class=\"btn btn-primary btn-view\" data-id=\"" + val.Id + "\">View</a></td></tr>";
            });
        }
        $("#reportsTable>tbody").html(tableRow);
        tableRow = "";
        $("#reportsTable").DataTable({
            responsive: true,
            initComplete: function () {
                var cols = [0, 2, 3, 4, 5, 6, 7];
                for (var i = 0; i < cols.length; i++) {
                    this.api().column(cols[i]).every(function () {
                        var column = this;
                        var select = $('<select class="select"><option value=""></option></select>')
                            .appendTo($(column.footer()).empty()).on("change", function () {
                            var val = $.fn.dataTable.util.escapeRegex($(this).val());
                            column.search(val ? "^" + val + "$" : "", true, false).draw();
                        });
                        column.data().unique().sort()
                            .each(function (k, v) {
                            select.append('<option value="' + k + '">' + k + "</option>");
                        });
                    });
                }
            },
        });
    };
    Courier.prototype.GetIsApprover = function () {
        var approverUrl = siteUrl +
            listUrl +
            "('Approvers')/items?$select=Location&$AdminId eq " +
            _spPageContextInfo.userId;
        Courier.prototype.RestCalls(approverUrl, Courier.prototype.AllRequests);
    };
    Courier.prototype.AcknowledgeReceiptFromUser = function (id, from) {
        swal({
            title: "Are you sure?",
            text: "You are about to accept the package from " + from,
            icon: "warning",
            buttons: true,
        }).then(function (result) {
            if (result) {
                ReceiveParcelFromUser();
            }
        });
        function ReceiveParcelFromUser() {
            var item = {
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
                }).then(function (result) {
                    location.reload();
                });
            }
        }
    };
    Courier.prototype.AcknowledgeReceiptFromCourier = function (id, from) {
        swal({
            title: "Are you sure?",
            text: "You are about to accept the package from " + from,
            icon: "warning",
            buttons: true,
        }).then(function (result) {
            if (result) {
                ReceiveFromCourier();
            }
        });
        function ReceiveFromCourier() {
            var item = {
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
                }).then(function (result) {
                    location.reload();
                });
            }
        }
    };
    Courier.prototype.GetPackage = function (id) {
        var packageUrl = courierurl +
            "?$select=PackageType,Project,Origin,Destination,WayBillNo,Weight,Quantity," +
            "Description,Courier,Author/Title," +
            "Recipient/Title&$expand=Recipient,Author&$filter=Id eq " +
            id;
        Courier.prototype.RestCalls(packageUrl, PopulateSendModal);
        $("#adminModal").modal();
        $("#hidden-id").val(id);
        function PopulateSendModal(d) {
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
    };
    Courier.prototype.GiveRecipient = function (id, from) {
        swal({
            title: "Are you sure?",
            text: "You are about to hand over the package to " + from,
            icon: "warning",
            buttons: true,
        }).then(function (result) {
            if (result) {
                GivePackageRecipient();
            }
        });
        function GivePackageRecipient() {
            var item = {
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
                }).then(function (result) {
                    location.reload();
                });
            }
        }
    };
    Courier.prototype.AssignPackage = function () {
        var item = {
            __metadata: { type: "SP.Data.CourierListItem" },
            Courier: $("#vehicletype").val(),
            CourierStatus: "Received",
            Weight: $("#weightModal").val(),
            WayBillNo: $("#waybillNo").val(),
            CourierDate: moment().toISOString(),
        };
        Courier.prototype.UpdateJson(courierurl + "(" + $("#hidden-id").val() + ")", item, success);
        function success() {
            swal({
                title: "Success",
                text: "Package sent successfully",
                icon: "success",
            }).then(function (result) {
                location.reload();
            });
        }
    };
    return Courier;
}());
$(document).ready(function () {
    var courier = new Courier();
    courier.PrepSendForm();
    courier.GetParentDigest().then(function (d) {
        parentDigest = d.d.GetContextWebInformation.FormDigestValue;
        courier.GetParentRequests();
    });
    courier.GetAllUsers();
    courier.GetIsApprover();
    $("#adminsendtable").on("click", ".btn-acknowledge", function () {
        var id = $(this).data("id");
        var from = $(this).data("from");
        courier.AcknowledgeReceiptFromUser(id, from);
    });
    $("#adminreceivetable").on("click", ".btn-acknowledge", function () {
        var id = $(this).data("id");
        var from = $(this).data("from");
        courier.AcknowledgeReceiptFromCourier(id, from);
    });
    $("#adminsendtable").on("click", ".btn-assign", function () {
        var id = $(this).data("id");
        courier.GetPackage(id);
    });
    $("#adminreceivetable").on("click", ".btn-assign", function () {
        var id = $(this).data("id");
        var from = $(this).data("from");
        courier.GiveRecipient(id, from);
    });
    $("#btn-send-courier").click(function () {
        courier.AssignPackage();
    });
    $("#reportsTable").on("click", ".btn-view", function () {
        var id = $(this).data("id");
        courier.GetPackage(id);
    });
});
