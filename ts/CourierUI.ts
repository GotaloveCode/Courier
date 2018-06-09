import { Courier } from "./Courier";

declare var _spPageContextInfo: any;

export class CourierUI {

    GetCurrentParcelLocation(courierdata: Courier): string {
        let parcelStatus = "";

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

    GetMySent(d: any) {
        let courierlist: Array<Courier>;
        $.each(d, function (i, j) {
            let courier: Courier = new Courier();
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
        this.ValidateCourier();
    }

    SendFormData() {
        let courier = new Courier();
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
            .on("success.form.fv", function (e: any) {
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
    }

    PopulateRecipient(d: any) {
        let content = "";
        if (d.results) {
            $.each(d.results, function (i, j) {
                content += "<option value=" + j.Id + ">" + j.Title + "</option>";
            });
        }
        $("#recipient").empty().append(content).chosen();
    }

    PopulateLocations(d: any) {
        let content = "<option val=''></option>";
        $.each(d, function (i, j) {
            content += "<option>" + j.Title + "</option>";
        });
        $("#origin,#destination").empty().append(content).chosen();
    }

    PopulateProjects(d: any) {
        let content = "";
        $.each(d, function (i, j) {
            content += "<option>" + j.Title + "</option>";
        });
        $("#project").empty().append(content).chosen();
    }

    PopulateMySent(d: any) {
        let courierlist: Array<Courier>;
        if (d) {
            $.each(d, function (i, j) {
                let courier: Courier = new Courier();
                courier.PackageType = d.PackageType;
                courier.Project = d.Project;
                courier.Origin = d.Origin;
                courier.Destination = d.Destination;
                courier.Description = d.Description;
                courier.SendingAdminStatus = d.SendingAdminStatus;
                courier.Courier = d.Courier;
                courier.CourierStatus = d.CourierStatus;
                courier.ReceivingAdminStatus = d.ReceivingAdminStatus;
                courier.RecipientStatus = d.RecipientStatus;
                if (d.Recipient) {
                    courier.Recipient = d.Recipient.Title;
                }
                courierlist.push(courier);
            });
            if (courierlist.length > 0) {
                this.LoadMySentParcels(courierlist);
            }
            courierlist = null;
        }
    }

    LoadMySentParcels(data: Array<Courier>) {
        let tableRow = "";
        $.each(data, function (key, val) {
            let parcelLocation = this.GetCurrentParcelLocation(val);
            tableRow += `<tr><td> ${val.PackageType} </td><td> ${
                val.Project
                } </td><td> ${val.Origin} </td><td> ${
                val.Recipient
                } </td><td> ${val.Destination}</td><td> ${val.Description} </td><td> ${
                parcelLocation
                } </td></tr>`;
        });
        $("#sentTable>tbody").html(tableRow);
        $("#sentTable").DataTable({ responsive: true });
    }

    PopulateMyReceived(d: any) {
        let courierlist: Array<Courier>;
        if (d) {
            $.each(d, function (i, j) {
                let courier: Courier = new Courier();
                courier.PackageType = d.PackageType;
                courier.Project = d.Project;
                courier.Origin = d.Origin;
                courier.Destination = d.Destination;
                courier.Description = d.Description;
                courier.SendingAdminStatus = d.SendingAdminStatus;
                courier.Courier = d.Courier;
                courier.CourierStatus = d.CourierStatus;
                courier.ReceivingAdminStatus = d.ReceivingAdminStatus;
                courier.RecipientStatus = d.RecipientStatus;
                courier.Sender = d.Sender.Title;
                courierlist.push(courier);
            });
            if (courierlist.length > 0) {
                this.LoadMyReceivedParcels(courierlist);
            }
            courierlist = null;
        }
    }

    LoadMyReceivedParcels(data: Array<Courier>) {
        let tableRow = "";
        $.each(data, function (key, val) {
            let parcelLocation = this.GetCurrentParcelLocation(val);
            tableRow += `<tr><td> ${val.PackageType} </td><td> ${
                val.Project
                } </td><td> ${val.Sender} </td><td> ${
                val.Origin
                } </td><td> ${val.Destination}</td><td> ${val.Description} </td><td> ${
                parcelLocation
                } </td></tr>`;
        });
        $("#receivedTable>tbody").html(tableRow);
        tableRow = "";
        $("#receivedTable").DataTable({ responsive: true });
    }

    IsAdmin(d: any) {
        if (d.length <= 0) {
            $("#sidebar .nav-item").eq(3).hide();
            $("#sidebar .nav-item").eq(4).hide();
        } else {
            console.log(d);
        }
    }

}
