var Resource = (function () {
    function Resource() {
    }
    return Resource;
}());
var Refreshment = (function () {
    function Refreshment() {
    }
    return Refreshment;
}());
var ResourceBooking = (function () {
    function ResourceBooking() {
        this.parentDigest = null;
        this.siteUrl = _spPageContextInfo.webAbsoluteUrl;
        this.parentUrl = "https://egpafkenya.sharepoint.com/sites/egpafke";
        this.listUrl = "/_api/web/lists/getbytitle";
        this.ResourceBookingurl = siteUrl + listUrl + "('ResourceBooking')/items";
        this.Refreshmentsurl = siteUrl + listUrl + "('Refreshments')/items";
    }
    ResourceBooking.prototype.PostResource = function () {
        var resource = new Resource();
        resource.MeetingDate = $("#date").val();
        resource.MeetingTitle = $("#meetingName").val();
        resource.Room = $("#room").val();
        resource.Start = $("#start").val();
        resource.End = $("#end").val();
        resource.NatureOfAssistance = $("#nature").val();
        resource.Equipment = $("input[name=equipment]:checked")
            .map(function () {
            return this.value;
        })
            .get()
            .join(",");
        var Refreshments;
        var item = $("input[name=item[]]");
        for (var index = 0; index < item.length; index++) {
            var refreshment = new Refreshment();
            refreshment.Title = $(item[index]).val();
            refreshment.UnitCost = $("input[name=unit-cost[][]").val();
            refreshment.UnitOfMeasure = $("input[name=unitofmeasure[]").val();
            refreshment.Units = $("input[name=number[]").val();
            Refreshments.push(refreshment);
        }
        var data = {
            __metadata: { type: "SP.Data.ResourceBookingListItem" },
        };
        data = $.extend(data, resource);
        this.PostJson(this.ResourceBookingurl, data, postRefreshments, this.OnError);
        function postRefreshments(d) {
            var batchExecutor = new RestBatchExecutor(siteUrl, {
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            });
            var commands = [];
            var batchRequest = new BatchRequest();
            for (var index = 0; index < Refreshments.length; index++) {
                var postdata = {
                    __metadata: { type: "SP.Data.RefreshmentsListItem" },
                };
                var refreshment = Refreshments[index];
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
            batchExecutor.executeAsync().done(function (result) {
                var i = 0;
                $.each(result, function (k, v) {
                    i++;
                    var command = $.grep(commands, function (c) {
                        return v.id === c.id;
                    });
                    if (command[0].title === "getRefresh1") {
                        swal("success", "Resource booked successfully", "success");
                    }
                });
            });
        }
        return 0;
    };
    ResourceBooking.prototype.PostJson = function (endpointUri, payload, success, error) {
        $.ajax({
            contentType: "application/json;odata=verbose",
            headers: {
                Accept: "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            },
            data: JSON.stringify(payload),
            error: error,
            success: success,
            type: "POST",
            url: endpointUri,
        });
    };
    ResourceBooking.prototype.OnError = function (error) {
        swal("Error", error.responseText, "error");
    };
    ResourceBooking.prototype.RestCalls = function (u, f) {
        return $.ajax({
            url: u,
            method: "GET",
            headers: { Accept: "application/json; odata=verbose" },
            success: function (data) {
                f(data.d);
            },
            error: this.OnError,
        });
    };
    ResourceBooking.prototype.AllRequests = function (d) {
        var admin = false;
        if (d.length > 0) {
            console.log(d);
            admin = true;
            $("#sidebar .nav-item").removeClass("hidden");
        }
        var batchExecutor = new RestBatchExecutor(siteUrl, {
            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
        });
        var batchRequest = new BatchRequest();
        var commands = [];
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
            .done(function (result) {
            $.each(result, function (k, v) {
                var command = $.grep(commands, function (c) {
                    return v.id === c.id;
                });
                if (command[0].title === "getAllBookings") {
                    this.PopulateCalendar(v.result.result.value);
                }
                if (command[0].title === "getBoardRooms") {
                    this.PopulateBoardRoom(v.result.result.value);
                }
                if (command[0].title === "getReports") {
                }
            });
        })
            .fail(function (err) {
            this.OnError(err);
        });
    };
    ResourceBooking.prototype.PopulateBoardRoom = function (d) {
        var option = "";
        $.each(d, function (i, j) {
            option += "<option>" + j.Title + "</option>";
        });
        $("#room").html(option);
    };
    ResourceBooking.prototype.PopulateCalendar = function (d) {
        var bookings = [];
        $.each(d, function (i, j) {
            var app_day = moment(j.MeetingDate).format('YYYY-MM-DD');
            var startdate = moment(app_day + " " + j.Start).toISOString();
            var enddate = moment(app_day + " " + j.End).toISOString();
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
            navLinks: true,
            selectable: true,
        });
    };
    ResourceBooking.prototype.GetIsApprover = function () {
        var approverUrl = siteUrl + this.listUrl +
            "('ResourceAdmin')/items?$select=Id&$filter=AdminId eq " + _spPageContextInfo.userId;
        this.RestCalls(approverUrl, this.AllRequests);
    };
    ResourceBooking.prototype.adjustIframeHeight = function () {
        var $body = $("body"), $iframe = $body.data("iframe.fv");
        if ($iframe) {
            $iframe.height($body.height());
        }
    };
    ResourceBooking.prototype.initForm = function () {
        $("#requesterDetails").steps({
            headerTag: "h3",
            bodyTag: "fieldset",
            transitionEffect: "slideLeft",
            onStepChanging: function (e, currentIndex, newIndex) {
                this.adjustIframeHeight();
                if (currentIndex > newIndex) {
                    return true;
                }
                var fv = $("#requesterDetails").data("formValidation"), $container = $("#requesterDetails").find('fieldset[data-step="' + currentIndex + '"]');
                fv.validateContainer($container);
                var isValidStep = fv.isValidContainer($container);
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
                }
                else if (currentIndex === 1 && newIndex === 2) {
                    var items = $('input[name="equipment"]:checked');
                    var list_1 = "";
                    $.each(items, function (k, v) {
                        list_1 += "<li>" + v.value + "</li>";
                    });
                    $("#natureneeded").html($("#nature").val());
                    $("#materialsneeded").html("<ul>" + list_1 + "</ul>");
                }
                else if (currentIndex === 2 && newIndex === 3) {
                    var content_1 = "";
                    $("#tableItems tbody tr").each(function (index, value) {
                        content_1 += "<tr>";
                        content_1 += "<td>" + $(this).find("#item").val() + "</td>";
                        content_1 += "<td>" + $(this).find(".unitOfmeasure").val() + "</td>";
                        content_1 += "<td>" + $(this).find("#number").val() + "</td>";
                        content_1 += "<td>" + $(this).find("#unit-cost").val() + "</td>";
                        content_1 += "<td>" + $(this).find("#totalamount").val() + "</td>";
                        content_1 += "</tr>";
                    });
                    content_1 += "<tr>";
                    content_1 += '<td colspan="4">Overall Total Amount</td>';
                    content_1 += "<td>" + $("#totalcost").text() + "</td>";
                    content_1 += "</tr>";
                    $("#itemslist").html(content_1);
                }
                return true;
            },
            onFinishing: function (e, currentIndex) {
                var fv = $("#requesterDetails").data("formValidation"), $container = $("#requesterDetails").find('fieldset[data-step="' + currentIndex + '"]');
                fv.validateContainer($container);
                var isValidStep = fv.isValidContainer($container);
                if (isValidStep === false || isValidStep === null) {
                    return false;
                }
                return true;
            },
            onFinished: function (e, currentIndex) {
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
        })("success.form.fv", function (e) {
            e.preventDefault();
            this.PostResource();
        });
    };
    return ResourceBooking;
}());
$("#starttimepicker,#endtimepicker").datetimepicker({ format: "LT" });
$(document).ready(function () {
    var resourceBooking = new ResourceBooking();
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
            '</div></td><td><input type="number" name="number[]" id="number" class="form-control quantity"></td>' +
            '<td><input type="number" name="unit-cost[]" id="unit-cost" class="form-control unitcost"></td>' +
            '<td><input type="text" name="totalamount[]" id="totalamount" class="form-control subtotal" readonly></td></tr>');
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
    var i = $("#tableItems tr").length;
    $("#btnremove").on("click", function () {
        if (i > 2) {
            $itemoption = $("#tableItems tr:last").find('[name="item[]"]');
            $unitoption = $("#tableItems tr:last").find('[name="unitofmeasure[]"]');
            $numberoption = $("#tableItems tr:last").find('[name="number[]"]');
            $unitCostoption = $("#tableItems tr:last").find('[name="unit-cost[]"]');
            $totaloption = $("#tableItems tr:last").find('[name="totalamount[]"]');
            $("#requesterDetails").formValidation("removeField", $itemoption);
            $("#requesterDetails").formValidation("removeField", $unitoption);
            $("#requesterDetails").formValidation("removeField", $numberoption);
            $("#requesterDetails").formValidation("removeField", $unitCostoption);
            $("#requesterDetails").formValidation("removeField", $totaloption);
            $("#tableItems tr:last").remove();
            i--;
            var total_pre_1 = 0;
            $(".subtotal").each(function (index, val) {
                total_pre_1 += parseInt($(val).val().replace(/,/g, ""));
            });
            $("#totalcost").text(total_pre_1.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"));
        }
    });
    $(".content").on("keyup", ".unitcost", function () {
        var cost = $(this).val();
        var quantity = $(this).closest("td").prev().find(".quantity").val();
        if (cost && quantity) {
            $(this).closest("td").next().find(".subtotal").val((cost * quantity).toFixed(2));
            var total_pre_2 = 0;
            $(".subtotal").each(function (index, val) {
                total_pre_2 += parseInt($(val).val().replace(/,/g, ""));
            });
            $("#totalcost").text(total_pre_2.toFixed(2));
        }
    });
    $(".content").on("keyup", ".quantity", function () {
        var quantity = $(this).val();
        var cost = $(this).closest("td").next().find(".unitcost").val();
        if (cost && quantity) {
            $(this).closest("td").next().next().find(".subtotal").val((cost * quantity).toFixed(2));
            var total_pre_3 = 0;
            $(".subtotal").each(function (index, val) {
                total_pre_3 += parseInt($(val).val().replace(/,/g, ""));
            });
            $("#totalcost").text(total_pre_3.toFixed(2));
        }
    });
});
