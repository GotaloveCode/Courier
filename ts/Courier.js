var parentDigest = null;
var siteUrl = _spPageContextInfo.webAbsoluteUrl;
var parentUrl = "https://egpafkenya.sharepoint.com/sites/egpafke";
var listUrl = "/_api/web/lists/getbytitle";
var mySentUrl = siteUrl +
    listUrl +
    "('Courier')/items?$select=PackageType,Project,Origin,Destination," +
    "Description,SendingAdminStatus,Courier,CourierStatus,ReceivingAdminStatus,RecipientStatus," +
    "Recipient/Title&$expand=Recipient&$filter=AuthorId eq " +
    _spPageContextInfo.userId;
var myReceivedUrl = siteUrl +
    listUrl +
    "('Courier')/items?$select=PackageType,Project,Origin,Destination," +
    "Description,SendingAdminStatus,Courier,CourierStatus,ReceivingAdminStatus,RecipientStatus," +
    "Sender/Title&$expand=Sender&$filter=RecipientId eq " +
    _spPageContextInfo.userId;
var Courier = (function () {
    function Courier() {
        this.courierurl = siteUrl + "/_api/web/lists/getbytitle('Courier')/items";
    }
    Courier.prototype.PostCourier = function (callback) {
        var data = {
            __metadata: { type: "SP.Data.CourierListItem" },
            RecipientId: this.RecipientId,
            Description: this.Description,
            Destination: this.Destination,
            Origin: this.Origin,
            PackageType: this.PackageType,
            Project: this.Project
        };
        this.PostJson(this.courierurl, data, callback, this.OnError);
        return 0;
    };
    Courier.prototype.PostJson = function (endpointUri, payload, success, error) {
        $.ajax({
            contentType: "application/json;odata=verbose",
            headers: { "Accept": "application/json;odata=verbose", "X-RequestDigest": $("#__REQUESTDIGEST").val() },
            data: JSON.stringify(payload),
            error: error,
            success: success,
            type: "POST",
            url: endpointUri
        });
    };
    Courier.prototype.OnError = function (error) {
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
            error: this.OnError
        });
    };
    Courier.prototype.AllRequests = function () {
        var batchExecutor = new RestBatchExecutor(siteUrl, {
            "X-RequestDigest": $("#__REQUESTDIGEST").val()
        });
        var batchRequest = new BatchRequest();
        var commands = [];
        batchRequest.endpoint = mySentUrl;
        batchRequest.headers = { accept: "application/json;odata=nometadata" };
        commands.push({
            id: batchExecutor.loadRequest(batchRequest),
            title: "GetMySent"
        });
        batchRequest.endpoint = myReceivedUrl;
        batchRequest.headers = { accept: "application/json;odata=nometadata" };
        commands.push({
            id: batchExecutor.loadRequest(batchRequest),
            title: "GetMyReceived"
        });
        batchRequest.endpoint = siteUrl + listUrl + "('Approvers')/items?$select=Location&$AdminId eq " + _spPageContextInfo.userId;
        batchRequest.headers = { accept: "application/json;odata=nometadata" };
        commands.push({
            id: batchExecutor.loadRequest(batchRequest),
            title: "IsAdmin"
        });
        batchExecutor
            .executeAsync()
            .done(function (result) {
            $.each(result, function (k, v) {
                var command = $.grep(commands, function (c) {
                    return v.id === c.id;
                });
                if (command[0].title === "GetMySent") {
                    Courier.prototype.PopulateMySent(v.result.result.value);
                }
                if (command[0].title === "GetMyReceived") {
                    Courier.prototype.PopulateMyReceived(v.result.result.value);
                }
                if (command[0].title === "IsAdmin") {
                    Courier.prototype.IsAdmin(v.result.result.value);
                }
            });
        })
            .fail(function (err) {
            this.OnError(err);
        });
    };
    Courier.prototype.GetAllUsers = function () {
        var memberUrl = parentUrl +
            "/_api/web/sitegroups/getbyname('EGPAF Members')/users?$select=Title,Id";
        var userList;
        this.RestCalls(memberUrl, populateRecipient);
        function populateRecipient(d) {
            var content = "";
            if (d.results) {
                $.each(d.results, function (i, j) {
                    content += "<option value=" + j.Id + ">" + j.Title + "</option>";
                });
            }
            $("#recipient").empty().append(content).chosen();
        }
    };
    Courier.prototype.GetParentDigest = function (callback) {
        return $.ajax({
            url: parentUrl + "/_api/contextinfo",
            method: "POST",
            contentType: "application/json;odata=verbose",
            headers: { "Accept": "application/json;odata=verbose", "X-RequestDigest": $("#__REQUESTDIGEST").val() },
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
            this.OnError(err);
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
    Courier.prototype.GetMySent = function (d) {
        var courierlist;
        $.each(d, function (i, j) {
            var courier = new Courier();
            courier.PackageType = d.PackageType;
            courier.Project = d.Project;
            courier.Origin = d.Origin;
            courier.Destination = d.Destination;
            courier.Description = d.Description;
            courier.SendingAdminStatus = d.SendingAdminStatus;
            courier.Sender = _spPageContextInfo.userDisplayName;
            courier.Courier = d.Courier;
            courier.CourierStatus = d.CourierStatus;
            courier.ReceivingAdminStatus = d.ReceivingAdminStatus;
            courier.RecipientStatus = d.RecipientStatus;
            courier.Recipient = d.Recipient.Title;
            courierlist.push(courier);
        });
        this.LoadMySentParcels(courierlist);
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
        this.ValidateCourier();
    };
    Courier.prototype.SendFormData = function () {
        var courier = new Courier();
        courier.PackageType = $("#packagetype").val();
        courier.Project = $("#project").val();
        courier.Destination = $("#destination").val();
        courier.RecipientId = $("#recipient").val();
        courier.Origin = $("#origin").val();
        courier.Description = $("#description").val();
        courier.PostCourier(function () {
            swal({
                title: "Success!",
                text: "Courier request submitted successfully",
                type: "success"
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
                validating: "fa fa-refresh"
            },
            fields: {
                package: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The package is required"
                        }
                    }
                },
                sender: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The sender is required"
                        }
                    }
                },
                description: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The description is required"
                        }
                    }
                },
                destination: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The destination is required"
                        }
                    }
                },
                recipient: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The recipient is required"
                        }
                    }
                },
                origin: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The origin is required"
                        }
                    }
                },
                project: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Project is required"
                        }
                    }
                }
            }
        })
            .on("success.form.fv", function (e) {
            e.preventDefault();
            this.SendFormData();
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
                            message: "The location is required"
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
                            message: "The Date is required"
                        }
                    }
                }
            }
        });
        $("#officeadmin2").formValidation({
            framework: "bootstrap",
            icon: {
                valid: "fa fa-check",
                invalid: "fa fa-times",
                validating: "fa fa-refresh"
            },
            fields: {
                office2_package: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The package is required"
                        }
                    }
                },
                office2_sender: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The sender is required"
                        }
                    }
                },
                office2_description: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The description is required"
                        }
                    }
                },
                office2_transittype: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Transit Type is required"
                        }
                    }
                },
                office2_waybillno: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Waybill Number is required"
                        }
                    }
                },
                office2_destination: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The destination is required"
                        }
                    }
                },
                office2_recipient: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The recipient is required"
                        }
                    }
                },
                office2_location: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The location is required"
                        }
                    }
                },
                office2_project: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Project is required"
                        }
                    }
                },
                office2_producttype: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Product Type is required"
                        }
                    }
                },
                office2_weight: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Weight is required"
                        }
                    }
                },
                office2_date: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Date is required"
                        }
                    }
                }
            }
        });
        $("#receivertab").formValidation({
            framework: "bootstrap",
            icon: {
                valid: "fa fa-check",
                invalid: "fa fa-times",
                validating: "fa fa-refresh"
            },
            fields: {
                rpackage: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The package is required"
                        }
                    }
                },
                rsender: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The sender is required"
                        }
                    }
                },
                rdescription: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The description is required"
                        }
                    }
                },
                rtransittype: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Transit Type is required"
                        }
                    }
                },
                r_waybillno: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Waybill Number is required"
                        }
                    }
                },
                rdestination: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The destination is required"
                        }
                    }
                },
                rrecipient: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The recipient is required"
                        }
                    }
                },
                rlocation: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The location is required"
                        }
                    }
                },
                rproject: {
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
                rweight: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Weight is required"
                        }
                    }
                },
                rdate: {
                    row: ".col-xs-4",
                    validators: {
                        notEmpty: {
                            message: "The Date is required"
                        }
                    }
                }
            }
        });
    };
    Courier.prototype.PopulateLocations = function (d) {
        var content = "";
        $.each(d, function (i, j) {
            content += "<option>" + j.Title + "</option>";
        });
        $("#origin,#destination").empty().append(content).chosen();
    };
    Courier.prototype.PopulateProjects = function (d) {
        var content = "";
        $.each(d, function (i, j) {
            content += "<option>" + j.Title + "</option>";
        });
        $("#project").empty().append(content).chosen();
    };
    Courier.prototype.PopulateMySent = function (d) {
        var tableRow = "";
        $.each(d, function (key, val) {
            var parcelLocation = this.GetCurrentParcelLocation(val);
            tableRow += "<tr><td> " + val.PackageType + " </td><td> " + val.Project + " </td><td> " + val.Origin + " </td><td> " + val.Recipient + " </td><td> " + val.Destination + "</td><td> " + val.Description + " </td><td> " + parcelLocation + " </td></tr>";
        });
        $("#sentTable>tbody").html(tableRow);
        $("#sentTable").DataTable({ responsive: true });
    };
    Courier.prototype.PopulateMyReceived = function (d) {
        var tableRow = "";
        $.each(d, function (key, val) {
            var parcelLocation = this.GetCurrentParcelLocation(val);
            tableRow += "<tr><td> " + val.PackageType + " </td><td> " + val.Project + " </td><td> " + val.Sender + " </td><td> " + val.Origin + " </td><td> " + val.Destination + "</td><td> " + val.Description + " </td><td> " + parcelLocation + " </td></tr>";
        });
        $("#receivedTable>tbody").html(tableRow);
        tableRow = "";
        $("#receivedTable").DataTable({ responsive: true });
    };
    Courier.prototype.IsAdmin = function (d) {
        if (d.length <= 0) {
            $("#sidebar .nav-item").eq(3).hide();
            $("#sidebar .nav-item").eq(4).hide();
        }
        else {
            console.log(d);
        }
    };
    return Courier;
}());
