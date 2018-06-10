class Resource {
    Id: number;
    MeetingDate: string;
    RequesterId: number;
    MeetingTitle: string;
    Start: string;
    End: string;
    NatureOfAssistance: string;
    Equipment: string;
    Status: string;
    Room: string;
}

class Refreshment {
    Title: string;
    UnitOfMeasure: string;
    Units: number;
    UnitCost: number;
    ResourceId: number;
}
declare var _spPageContextInfo: any;
class ResourceBooking {
    constructor() { }

    parentDigest: string = null;
    siteUrl = _spPageContextInfo.webAbsoluteUrl;
    parentUrl = "https://egpafkenya.sharepoint.com/sites/egpafke";
    listUrl = "/_api/web/lists/getbytitle";
    ResourceBookingurl: string = siteUrl + listUrl + "('ResourceBooking')/items";
    Refreshmentsurl = siteUrl + listUrl + "('Refreshments')/items";

    PostResource(): number {
        let resource = new Resource();
        resource.MeetingDate = $("#date").val();
        resource.MeetingTitle = $("#meetingName").val();
        resource.Room = $("#room").val();
        resource.Start = $("#start").val();
        resource.End = $("#end").val();
        resource.NatureOfAssistance = $("#nature").val();
        resource.Equipment = $("input[name=equipment]:checked")
            .map(function (): string {
                return this.value;
            })
            .get()
            .join(",");

        let Refreshments: Array<Refreshment>;
        let item = $("input[name=item[]]");
        for (let index = 0; index < item.length; index++) {
            let refreshment = new Refreshment();
            refreshment.Title = $(item[index]).val();
            refreshment.UnitCost = $("input[name=unit-cost[][]").val();
            refreshment.UnitOfMeasure = $("input[name=unitofmeasure[]").val();
            refreshment.Units = $("input[name=number[]").val();
            Refreshments.push(refreshment);
        }

        let data: object = {
            __metadata: { type: "SP.Data.ResourceBookingListItem" },
        };
        data = $.extend(data, resource);
        this.PostJson(
            this.ResourceBookingurl,
            data,
            postRefreshments,
            this.OnError,
        );

        function postRefreshments(d: any) {
            let batchExecutor = new RestBatchExecutor(siteUrl, {
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            });
            let commands: any = [];
            let batchRequest = new BatchRequest();

            for (let index = 0; index < Refreshments.length; index++) {
                let postdata: object = {
                    __metadata: { type: "SP.Data.RefreshmentsListItem" },
                };
                let refreshment = Refreshments[index];
                refreshment.ResourceId = d.Id;
                postdata = $.extend(postdata, refreshment);
                batchRequest.payload = postdata;
                batchRequest.verb = "POST";
                batchRequest.endpoint = this.Refreshmentsurl;
                commands.push({
                    id: batchExecutor.loadChangeRequest(batchRequest),
                    title: "getRefresh" + index,
                });
            }
            batchExecutor.executeAsync().done(function (result: any) {
                let i = 0;
                $.each(result, function (k, v) {
                    i++;
                    let command = $.grep(commands, function (c) {
                        return v.id === c.id;
                    });
                    if (command[0].title === "getRefresh1") {
                        swal("success", "Resource booked successfully", "success");
                    }
                });
            });

        }
        return 0;
    }

    PostJson(endpointUri: string, payload: object, success: any, error: any) {
        $.ajax({
            contentType: "application/json;odata=verbose",
            headers: {
                Accept: "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            },
            data: JSON.stringify(payload),
            error,
            success,
            type: "POST",
            url: endpointUri,
        });
    }

    OnError(error: any) {
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
            error: this.OnError,
        });
    }

    AllRequests(d: any) {
        let admin = false;
        if (d.length > 0) {
            console.log(d);
            admin = true;
            $("#sidebar .nav-item").removeClass("hidden");
            // $("#sidebar .nav-item").eq(3).removeClass("hidden");
        }
        const batchExecutor = new RestBatchExecutor(siteUrl, {
            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
        });
        let batchRequest = new BatchRequest();
        let commands: any[] = [];
        if (!admin) {
            batchRequest.endpoint = this.ResourceBookingurl +
            "?$select=Title,MeetingDate,Start,End,Author/Title&$expand=Author&$filter=Status eq 'Approved'";
            batchRequest.headers = { accept: "application/json;odata=nometadata" };
            commands.push({
                id: batchExecutor.loadRequest(batchRequest),
                title: "getAllBookings",
            });
        }

        batchRequest.endpoint = siteUrl + listUrl + "('BoardRooms')/items?$select=Title";
        batchRequest.headers = { accept: "application/json;odata=nometadata" };
        commands.push({
            id: batchExecutor.loadRequest(batchRequest),
            title: "getBoardRooms",
        });
        if (admin) {
            //  #TODO determine which of this to remove since not both are required.
            batchRequest.endpoint = this.ResourceBookingurl +
            "?$select=Id,Title,MeetingDate,Room,Author/Title,Equipment&$expand=Author" +
            "&$filter=Status eq 'Approved'";
            batchRequest.headers = { accept: "application/json;odata=nometadata" };
            commands.push({
                id: batchExecutor.loadRequest(batchRequest),
                title: "getReports",
            });
            batchRequest.endpoint = this.ResourceBookingurl +
            "?$select=Id,Title,MeetingDate,Start,End,Room,Author/Title,Equipment,Status," +
            "AttachmentFiles,AttachmentFiles/ServerRelativeUrl,AttachmentFiles/FileName&$expand=Author,AttachmentFiles";
            batchRequest.headers = { accept: "application/json;odata=nometadata" };
            commands.push({
                id: batchExecutor.loadRequest(batchRequest),
                title: "getAdminReports",
            });
        }

        batchExecutor
            .executeAsync()
            .done(function (result: any) {
                $.each(result, function (k, v) {
                    let command = $.grep(commands, function (c: any) {
                        return v.id === c.id;
                    });
                    if (command[0].title === "getAllBookings") {
                        this.PopulateCalendar(v.result.result.value);
                    }
                    if (command[0].title === "getBoardRooms") {
                        this.PopulateBoardRoom(v.result.result.value);
                    }
                    if (command[0].title === "getReports") {
                        // Courier.prototype.IsAdmin(v.result.result.value);
                    }
                });
            })
            .fail(function (err: any) {
                this.OnError(err);
            });
    }

    PopulateBoardRoom(d: any) {
        let option = "";
        $.each(d, function (i, j) {
            option += "<option>" + j.Title + "</option>";
        });
        $("#room").html(option);
    }

    PopulateCalendar(d: any) {
        let bookings: any = [];
        $.each(d, function (i, j) {
            let app_day = moment(j.MeetingDate).format('YYYY-MM-DD');
            let startdate = moment(app_day + " " + j.Start).toISOString();
            let enddate = moment(app_day + " " + j.End).toISOString();
            bookings.push({
                id: j.Id,
                title: j.Title,
                allDay: false,
                start: startdate,
                end: enddate,
            });
        });
        $("#calendar").fullCalendar({
            themeSystem: "bootstrap4",
            header: {
                left: "prev,next today",
                center: "title",
                right: "month,agendaWeek,agendaDay",
            },
            events: bookings,
            navLinks: true, // can click day/week names to navigate views
            selectable: true,
        });
    }

    GetIsApprover() {
        const approverUrl = siteUrl + this.listUrl +
            "('ResourceAdmin')/items?$select=Id&$filter=AdminId eq " + _spPageContextInfo.userId;
        this.RestCalls(approverUrl, this.AllRequests);
    }

    adjustIframeHeight() {
        const $body = $("body"),
            $iframe = $body.data("iframe.fv");
        if ($iframe) {
            $iframe.height($body.height());
        }
    }

    public initForm() {
        $("#requesterDetails").steps({
            headerTag: "h3",
            bodyTag: "fieldset",
            transitionEffect: "slideLeft",
            onStepChanging: function (e: any, currentIndex: number, newIndex: number) {
                this.adjustIframeHeight();
                if (currentIndex > newIndex) {
                    return true;
                }
                let fv = $("#requesterDetails").data("formValidation"),
                    $container = $("#requesterDetails").find('fieldset[data-step="' + currentIndex + '"]');
                fv.validateContainer($container);

                let isValidStep = fv.isValidContainer($container);
                if (isValidStep === false || isValidStep === null) {
                    return false;
                }

                if (currentIndex === 0 && newIndex === 1) {
                    $("#roombind").html($("#room").val());
                    $("#dateofmeeting").html($("#date").val());
                    $("#nameofmeeting").html($("#meetingName").val());
                    $("#starttime").html($("#start").val());
                    $("#endtime").html($("#end").val());
                    $("#reqname").html($("#requesterName").val());
                    $("#durationMeeting").html($("#meetingDuration").val() + " " + $("#meetingDurationUnit").val());
                } else if (currentIndex === 1 && newIndex === 2) {
                    let items = $('input[name="equipment"]:checked');
                    let list = "";
                    $.each(items, function (k, v) {
                        list += "<li>" + v.value + "</li>";
                    });
                    $("#natureneeded").html($("#nature").val());
                    $("#materialsneeded").html("<ul>" + list + "</ul>");
                } else if (currentIndex === 2 && newIndex === 3) {
                    let content = "";
                    $("#tableItems tbody tr").each(function (index, value) {
                        content += "<tr>";
                        content += "<td>" + $(this).find("#item").val() + "</td>";
                        content += "<td>" + $(this).find(".unitOfmeasure").val() + "</td>";
                        content += "<td>" + $(this).find("#number").val() + "</td>";
                        content += "<td>" + $(this).find("#unit-cost").val() + "</td>";
                        content += "<td>" + $(this).find("#totalamount").val() + "</td>";
                        content += "</tr>";
                    });
                    content += "<tr>";
                    content += '<td colspan="4">Overall Total Amount</td>';
                    content += "<td>" + $("#totalcost").text() + "</td>";
                    content += "</tr>";

                    $("#itemslist").html(content);
                }
                return true;
            },
            onFinishing: function (e: any, currentIndex: number) {
                let fv = $("#requesterDetails").data("formValidation"),
                    $container = $("#requesterDetails").find('fieldset[data-step="' + currentIndex + '"]');

                // Validate the last step container
                fv.validateContainer($container);

                let isValidStep = fv.isValidContainer($container);
                if (isValidStep === false || isValidStep === null) {
                    return false;
                }

                return true;
            },
            onFinished: function (e: any, currentIndex: number) {
            },
        }).formValidation({
            framework: "bootstrap",
            icon: {
                valid: "fa fa-check",
                invalid: "fa fa-times",
                validating: "fa fa-refresh",
            },
            excluded: "disabled",
            fields: {
                room: {
                    validators: {
                        notEmpty: {
                            message: "Room is required",
                        },
                    },
                },
                date: {
                    validators: {
                        notEmpty: {
                            message: "Date of meeting is required",
                        },
                    },
                },
                meetingName: {
                    validators: {
                        notEmpty: {
                            message: "Name of meeting must be included",
                        },
                    },
                },
                meetingDuration: {
                    validators: {
                        notEmpty: {
                            message: "Duration of meeting is required",
                        },
                        greaterThan: {
                            value: 0,
                            message: "The value must be grater than 0",
                        },
                    },
                },
                start: {
                    validators: {
                        notEmpty: {
                            message: "Start time is required",
                        },
                    },
                },
                end: {
                    validators: {
                        notEmpty: {
                            message: "End time is required",
                        },
                    },
                },
                nature: {
                    required: false,
                },
                equipment: {
                    required: false,
                },
            },
        })("success.form.fv", function (e: any) {
            e.preventDefault();
            this.PostResource();
        });
    }
}
$("#starttimepicker,#endtimepicker").datetimepicker({ format: "LT" });
$(document).ready(function () {
    let resourceBooking = new ResourceBooking();
    resourceBooking.initForm();
    resourceBooking.GetIsApprover();
    $("#requesterName").val(_spPageContextInfo.userDisplayName);
    $("#reportstable").dataTable();
    $("#admintable").dataTable();
    $("#datepicker").datetimepicker({
        format: "DD-MM-YYYY",
    });
    $("select[name='unitofmeasure[]']").select2({
        tags: true,
    });
    $("#btnadd").on("click", function () {
        $("#tableItems tr:last").after('<tr><td><input type="text" class="form-control" name="item[]" id="item"></td><td>' +
            '<div class="form-group">' +
            '    <select name="unitofmeasure[]" id="unitOfmeasure" class="form-control input-sm unitOfmeasure">' +
            "    <option></option>" +
            "    <option>Pieces</option>" +
            "    <option>Kgs</option>" +
            "    <option>Litres</option>" +
            "    <option>Pax</option>" +
            "    <option>Reams</option>" +
            "    <option>Packs</option>" +
            "    <option>Tins</option>" +
            "    <option>Packets</option>" +
            "    </select>" +
            '</div></td><td><input type="number" name="number[]" id="number" class="form-control quantity"></td><td><input type="number" name="unit-cost[]" id="unit-cost" class="form-control unitcost"></td><td><input type="text" name="totalamount[]" id="totalamount" class="form-control subtotal" readonly></td></tr>');
        $itemoption = $("#tableItems tr:last").find('[name="item[]"]');
        $unitoption = $("#tableItems tr:last").find('[name="unitofmeasure[]"]');
        $numberoption = $("#tableItems tr:last").find('[name="number[]"]');
        $unitCostoption = $("#tableItems tr:last").find('[name="unit-cost[]"]');
        $totaloption = $("#tableItems tr:last").find('[name="totalamount[]"]');

        $("#requesterDetails").formValidation("addField", $itemoption);
        $("#requesterDetails").formValidation("addField", $unitoption);
        $("#requesterDetails").formValidation("addField", $numberoption);
        $("#requesterDetails").formValidation("addField", $unitCostoption);
        $("#requesterDetails").formValidation("addField", $totaloption);
        i++;

        $("select[name='unitofmeasure[]']").select2({
            tags: true,
        });
    });
    let i = $("#tableItems tr").length;
    $("#btnremove").on("click", function () {
        if (i > 2) {
            let $itemoption = $("#tableItems tr:last").find('[name="item[]"]');
            let $unitoption = $("#tableItems tr:last").find('[name="unitofmeasure[]"]');
            let $numberoption = $("#tableItems tr:last").find('[name="number[]"]');
            let $unitCostoption = $("#tableItems tr:last").find('[name="unit-cost[]"]');
            let $totaloption = $("#tableItems tr:last").find('[name="totalamount[]"]');

            $("#requesterDetails").formValidation("removeField", $itemoption);
            $("#requesterDetails").formValidation("removeField", $unitoption);
            $("#requesterDetails").formValidation("removeField", $numberoption);
            $("#requesterDetails").formValidation("removeField", $unitCostoption);
            $("#requesterDetails").formValidation("removeField", $totaloption);

            $("#tableItems tr:last").remove();
            i--;
            let total_pre = 0;
            $(".subtotal").each(function (index, val) {
                // tslint:disable-next-line:radix
                total_pre += parseInt($(val).val().replace(/,/g, ""));
            });

            $("#totalcost").text(total_pre.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"));
        }
    });

    $(".content").on("keyup", ".unitcost", function () {
        let cost = $(this).val();
        let quantity = $(this).closest("td").prev().find(".quantity").val();
        if (cost && quantity) {
            $(this).closest("td").next().find(".subtotal").val((cost * quantity).toFixed(2));
            let total_pre = 0;
            $(".subtotal").each(function (index, val) {
                total_pre += parseInt($(val).val().replace(/,/g, ""));
            });

            $("#totalcost").text(total_pre.toFixed(2));
        }
    });

    $(".content").on("keyup", ".quantity", function () {
        let quantity = $(this).val();
        let cost = $(this).closest("td").next().find(".unitcost").val();
        if (cost && quantity) {
            $(this).closest("td").next().next().find(".subtotal").val((cost * quantity).toFixed(2));
            let total_pre = 0;
            $(".subtotal").each(function (index, val) {
                // tslint:disable-next-line:radix
                total_pre += parseInt($(val).val().replace(/,/g, ""));
            });
            $("#totalcost").text(total_pre.toFixed(2));
        }
    });
});
