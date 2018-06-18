declare var _spPageContextInfo: any;
declare var SP: any;
const listUrl = "/_api/web/lists/getbytitle";
const ResourceBookingurl: string =
    _spPageContextInfo.webAbsoluteUrl + listUrl + "('ResourceBooking')/items";
const Refreshmentsurl =
    _spPageContextInfo.webAbsoluteUrl + listUrl + "('Refreshments')/items";

class Resource {
    Id: number;
    MeetingDate: string;
    RequesterId: number;
    Title: string;
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

class ResourceBooking {
    constructor() { }

    PostResource(): number {
        let resource = new Resource();
        resource.MeetingDate = moment(
            $("#date").val() + " " + moment().format("hh:mm:ss"),
            "DD-MM-YYYY hh:mm:ss"
        ).toISOString();
        resource.Title = $("#meetingName").val();
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

        let data: object = {
            __metadata: { type: "SP.Data.ResourceBookingListItem" }
        };
        data = $.extend(data, resource);
        ResourceBooking.prototype.PostJson(ResourceBookingurl, data, postRefreshments, ResourceBooking.prototype.OnError);

        function postRefreshments(d: any) {
            let batchExecutor = new RestBatchExecutor(
                _spPageContextInfo.webAbsoluteUrl,
                {
                    "X-RequestDigest": $("#__REQUESTDIGEST").val()
                }
            );
            let commands: any = [];
            let batchRequest = new BatchRequest();
            let Refreshments: Refreshment[] = new Array();
            let item = $("input[name='item[]']");
            let unitcost = $("input[name='unit-cost[]'");
            let unitofmeasure = $("select[name='unitofmeasure[]'");
            let unit = $("input[name='number[]'");
            for (let index = 0; index < item.length; index++) {
                let refreshment = new Refreshment();
                refreshment.Title = $(item[index]).val();
                refreshment.UnitCost = $(unitcost[index]).val();
                refreshment.UnitOfMeasure = $(unitofmeasure[index]).val();
                refreshment.Units = $(unit).val();
                refreshment.ResourceId = d.d.Id;
                Refreshments.push(refreshment);
            }

            for (let index = 0; index < Refreshments.length; index++) {
                let postdata: object = {
                    __metadata: { type: "SP.Data.RefreshmentsListItem" }
                };
                postdata = $.extend(postdata, Refreshments[index]);
                batchRequest.payload = postdata;
                batchRequest.verb = "POST";
                batchRequest.endpoint = Refreshmentsurl;
                commands.push({
                    id: batchExecutor.loadChangeRequest(batchRequest),
                    title: "getRefresh" + index
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

    GetResource(id: number) {
        let resUrl =
            ResourceBookingurl + "?$select=*,Author/Title&$expand=Author&$Id=" + id;
        let refUrl =
            _spPageContextInfo.webAbsoluteUrl +
            listUrl +
            "('Refreshments')/items?$select=Title,UntOfMeasure,Units,UnitCost&$filter=ResourceId eq " +
            id;
        const batchExecutor = new RestBatchExecutor(
            _spPageContextInfo.webAbsoluteUrl,
            {
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            }
        );
        let batchRequest = new BatchRequest();
        let commands: any[] = [];
        batchRequest.endpoint = resUrl;
        batchRequest.headers = { accept: "application/json;odata=nometadata" };
        commands.push({
            id: batchExecutor.loadRequest(batchRequest),
            title: "getResource"
        });
        batchRequest.endpoint = refUrl;
        batchRequest.headers = { accept: "application/json;odata=nometadata" };
        commands.push({
            id: batchExecutor.loadRequest(batchRequest),
            title: "getRefreshments"
        });
        batchExecutor
            .executeAsync()
            .done(function (result: any) {
                $.each(result, function (k, v) {
                    let command = $.grep(commands, function (c: any) {
                        return v.id === c.id;
                    });
                    if (command[0].title === "getResource") {
                        ResourceBooking.prototype.PopulateResourceModal(v.result.result.value);
                    }
                    if (command[0].title === "getRefreshments") {
                        ResourceBooking.prototype.PopulateRefreshmentsModal(v.result.result.value);
                    }
                });
            })
            .fail(function (err: any) {
                ResourceBooking.prototype.OnError(err);
            });
    }

    PostJson(endpointUri: string, payload: object, success: any, error: any) {
        $.ajax({
            contentType: "application/json;odata=verbose",
            headers: {
                Accept: "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            },
            data: JSON.stringify(payload),
            error,
            success,
            type: "POST",
            url: endpointUri,
        });
    }

    UpdateJson(Uri: string, payload: object, success: any) {
        $.ajax({
            url: Uri,
            type: "POST",
            data: JSON.stringify(payload),
            contentType: "application/json;odata=verbose",
            headers: {
                "Accept": "application/json;odata=verbose", "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "X-HTTP-Method": "MERGE", "If-Match": "*",
            },
            success: success,
            error: function (e: any) { ResourceBooking.prototype.OnError(e); },
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
            success: function (data: any) {
                f(data.d);
            },
            error: function (e: any) { ResourceBooking.prototype.OnError(e); },
        });
    }

    AllRequests(d: any) {
        let admin = false;
        if (d.results.length > 0) {
            admin = true;
            $("#sidebar .nav-item").removeClass("d-none");
        }
        const batchExecutor = new RestBatchExecutor(
            _spPageContextInfo.webAbsoluteUrl,
            {
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            }
        );
        let batchRequest = new BatchRequest();
        let commands: any[] = [];
        batchRequest.endpoint =
            _spPageContextInfo.webAbsoluteUrl +
            listUrl +
            "('BoardRooms')/items?$select=Title";
        batchRequest.headers = { accept: "application/json;odata=nometadata" };
        commands.push({
            id: batchExecutor.loadRequest(batchRequest),
            title: "getBoardRooms",
        });

        if (admin) {
            batchRequest.endpoint =
                ResourceBookingurl +
                "?$select=Id,Title,MeetingDate,Start,End,Room,Author/Title,Equipment,Status," +
                "AttachmentFiles,AttachmentFiles/ServerRelativeUrl,AttachmentFiles/FileName&$expand=Author,AttachmentFiles";
            batchRequest.headers = { accept: "application/json;odata=nometadata" };
            commands.push({
                id: batchExecutor.loadRequest(batchRequest),
                title: "PopulateAdmin",
            });
        } else {
            batchRequest.endpoint =
                ResourceBookingurl +
                "?$select=Title,MeetingDate,Start,End,Author/Title&$expand=Author&$filter=Status eq 'Approved'";
            batchRequest.headers = { accept: "application/json;odata=nometadata" };
            commands.push({
                id: batchExecutor.loadRequest(batchRequest),
                title: "getAllBookings"
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
                        ResourceBooking.prototype.PopulateCalendar(v.result.result.value);
                    }
                    if (command[0].title === "getBoardRooms") {
                        ResourceBooking.prototype.PopulateBoardRoom(v.result.result.value);
                    }
                    if (command[0].title === "PopulateAdmin") {
                        ResourceBooking.prototype.PopulateAdmin(v.result.result.value);
                    }
                });
            })
            .fail(function (err: any) {
                ResourceBooking.prototype.OnError(err);
            });
    }

    PopulateAdmin(d: any) {
        ResourceBooking.prototype.PopulateAdminTable(d);
        if (d.length > 0) {
            ResourceBooking.prototype.PopulateAdminReports(d);
        }
    }

    PopulateAdminReports(d: any) {
        let row = "";
        let bookers: any[] = new Array();
        $.each(d, function (i, j) {
            if (j.Status === "Approved") {
            row +=
                "<tr><td>" +
                j.Title +
                "</td><td>" +
                j.Room +
                "</td>" +
                "<td>" +
                j.Author.Title +
                "</td>" +
                "<td>" +
                moment(j.MeetingDate).format("DD/MM/YYYY") +
                "</td><td>" +
                j.Equipment +
                "</td></tr>";
            bookers.push(j.Author.Title);
            }
        });
        function onlyUnique(value: any, index: number, self: any) {
            return self.indexOf(value) === index;
        }
        bookers = bookers.filter(onlyUnique);
        bookers = bookers.sort();
        let option = "<option val=' '></option>";
        for (let index = 0; index < bookers.length; index++) {
            option += "<option val='" + bookers[index] + "'>" + bookers[index] + "</option>";
        }
        $("#bookedby").html(option);
        $("#reportstable>tbody").html(row);
        $("#reportstable").dataTable({ responsive: true });
    }

    PopulateAdminTable(d: any) {
        let row = "";
        $.each(d, function (i, j) {
            row +=
                "<tr><td>" +
                moment(j.MeetingDate).format("DD/MM/YYYY") +
                "</td><td>" +
                j.Start +
                "</td>" +
                "<td>" +
                j.End +
                "</td><td>" +
                j.Author.Title +
                "</td>" +
                "<td>" +
                j.Room +
                "</td><td>" +
                j.Status +
                "</td><td>" +
                getAttachmentLinks(j.AttachmentFiles, j.Id) +
                "</td><td><a href='#' class='btn btn-primary view-resource' data-id'" +
                j.Id +
                "'></a></td></tr>";
        });
        $("#admintable>tbody").html(row);
        $("#admintable").dataTable({ responsive: true });

        function getAttachmentLinks(Attachments: any, id: number): string {
            let links =
                "<a data-toggle='modal' data-id='" +
                id +
                "' class='btn btn-primary btn-uploadModal'>Attach</a>";
            $.each(Attachments, function (i, j) {
                if (j.ServerRelativeUrl !== null) {
                    links +=
                        '<a target="_blank" href="' +
                        j.ServerRelativeUrl +
                        '"><span class="fa fa-paperclip"></span>' +
                        j.FileName +
                        "</a>";
                }
            });
            return links;
        }
    }

    PopulateBoardRoom(d: any) {
        let option = "<option val=' '></option>";
        $.each(d, function (i, j) {
            option += "<option val='" + j.Title + "'>" + j.Title + "</option>";
        });
        $("#room,#filter_room").html(option);
        $("#filter_room").select2({ tags: true }).on("select2:select", function () {
            $.fn.dataTable.ext.search.push(
                function (settings: any, data: any, dataIndex: any) {
                    if (settings.nTable.id !== "reportstable") {
                        return true;
                    }
                    let value = $("#filter_room").val();
                    let dt = data[1];
                    if (value == null) {
                        return true;
                    } else if (value.indexOf(dt) !== -1) {
                        return true;
                    }
                });

        });
    }

    PopulateCalendar(d: any) {
        let bookings: any[] = new Array();
        if (d.length > 0) {
            $.each(d, function (i, j) {
                let app_day = moment(j.MeetingDate).format("YYYY-MM-DD");
                let startdate = moment(app_day + " " + j.Start).toISOString();
                let enddate = moment(app_day + " " + j.End).toISOString();
                bookings.push({
                    id: j.Id,
                    title: j.Title,
                    allDay: false,
                    start: startdate,
                    end: enddate
                });
            });
        }
        $("#calendar").fullCalendar({
            themeSystem: "bootstrap4",
            header: {
                left: "prev,next today",
                center: "title",
                right: "month,agendaWeek,agendaDay"
            },
            events: bookings,
            navLinks: true, // can click day/week names to navigate views
            selectable: true
        });
    }

    GetIsApprover() {
        const approverUrl =
            _spPageContextInfo.webAbsoluteUrl +
            listUrl +
            "('ResourceAdmin')/items?$select=Id&$filter=AdminId eq " +
            _spPageContextInfo.userId;
        ResourceBooking.prototype.RestCalls(approverUrl, ResourceBooking.prototype.AllRequests);
    }

    UploadDocument() {
        if ($("#doc_file").val() === "") {
            swal("Error", "No file selected for upload", "error");
            return;
        }
        swal({
            title: "Are you sure?",
            text: "You are about to upload the document?",
            type: "warning",
            showCancelButton: true,
            closeOnConfirm: false,
            showLoaderOnConfirm: true,
            confirmButtonText: "Submit",
            confirmButtonColor: "#5cb85c",
        }).then(() => {
            submitDoc();
        });

        function submitDoc() {
            let listName = "ResourceBooking",
                fileArray = [];
            const fileInput = $("#doc_file");
            let filename = fileInput
                .val()
                .split("\\")
                .pop();
            ResourceBooking.prototype.UploadFileSP(listName, $("#upload-id").val(), fileInput[0].files[0], filename);
        }
    }

    PopulateResourceModal(d: any) {
        if (d.length > 0) {
            $.each(d, function (i, j) {
                $("#m-requester").text(j.Author.Title);
                $("#m-meeting-date").text(moment(j.MeetingDate).format("DD-MM-YYYY"));
                $("#m-meeting-duration").text(ResourceBooking.prototype.TimeDifference(j.Start, j.End));
                $("#m-start").text(j.Start);
                $("#m-end").text(j.End);
                $("#m-room").text(j.Room);
                if (j.Status === "Pending") {
                    $("#btn-approve").removeClass("hidden");
                }
            });
        }
        $("#approveModal").modal();
    }

    Approve(id: number) {
        let item = {
            __metadata: { type: "SP.Data.ResourceBookingListItem" },
            Status: "Approved",
        };
        ResourceBooking.prototype.UpdateJson(ResourceBookingurl + "(" + id + ")", item, success);
        function success() {
            swal({
                title: "success",
                text: "Resource Approved Successfully",
                type: "success",
            }).then((result: any) => {
                location.reload();
            });
        }
    }

    TimeDifference(start: string, end: string): string {
        let diff = "";
        let startTime = moment(start, "HH:mm:ss a");
        let endTime = moment(end, "HH:mm:ss a");
        let duration = moment.duration(endTime.diff(startTime));
        let hours = parseInt(duration.asHours());
        let minutes = parseInt(duration.asMinutes()) % 60;
        diff = hours + " hour(s) " + minutes + " minutes";
        return diff;
    }

    PopulateRefreshmentsModal(d: any) {
        if (d.length > 0) {
            let row = "", cost = 0;
            $.each(d, function (i, j) {
                cost += (j.Units * j.UnitOfMeasure);
                row += `<tr>
                <td>${j.Title}</td>
                <td>${j.UnitOfMeasure}</td>
                <td>${j.Units}</td>
                <td>${j.UnitCost}</td>
                <td>${j.Units}*${j.UnitCost}</td>
                </tr>`;
            });
            $("#m-refreshments>tbody").html(row);
            $("#m-refreshments>tfoot tr td:last-child()").html(cost);
        }
    }

    UploadFileSP(listName: string, id: number, file: object, fileName: string) {
        function GetFileBuffer(docfile: any) {
            let dfd = $.Deferred();
            let reader = new FileReader();
            reader.onload = function (e) {
                dfd.resolve(e.target.result);
            };
            reader.onerror = function (e) {
                dfd.reject(e.target.error);
            };
            reader.readAsArrayBuffer(docfile);
            return dfd.promise();
        }
        let deferred = $.Deferred();

        GetFileBuffer(file).then(
            function (buffer: any) {
                let bytes = new Uint8Array(buffer);
                let binary = "";
                for (let b = 0; b < bytes.length; b++) {
                    binary += String.fromCharCode(bytes[b]);
                }
                let scriptbase =
                    _spPageContextInfo.webServerRelativeUrl + "/_layouts/15/";
                console.log(" File size:" + bytes.length);
                $.getScript(scriptbase + "SP.RequestExecutor.js", function () {
                    let createitem = new SP.RequestExecutor(
                        _spPageContextInfo.webServerRelativeUrl
                    );
                    createitem.executeAsync({
                        url:
                            _spPageContextInfo.webServerRelativeUrl +
                            "/_api/web/lists/GetByTitle('" +
                            listName +
                            "')/items(" +
                            id +
                            ")/AttachmentFiles/add(FileName='" +
                            file.name +
                            "')",
                        method: "POST",
                        binaryStringRequestBody: true,
                        body: binary,
                        success: fsucc,
                        error: ferr,
                        state: "Update"
                    });
                    function fsucc(data: any) {
                        swal("File uploaded successfully");
                        deferred.resolve(data);
                    }
                    function ferr(data: any) {
                        swal("error", fileName + " not uploaded error", "error");
                        deferred.reject(data);
                    }
                });
            },
            function (err) {
                deferred.reject(err);
            },
        );
        return deferred.promise();
    }

    adjustIframeHeight() {
        const $body = $("body"),
            $iframe = $body.data("iframe.fv");
        if ($iframe) {
            $iframe.height($body.height());
        }
    }

    public initForm() {
        $("#requesterDetails")
            .steps({
                headerTag: "h3",
                bodyTag: "fieldset",
                transitionEffect: "slideLeft",
                onStepChanging: function (
                    e: any,
                    currentIndex: number,
                    newIndex: number,
                ) {
                    this.adjustIframeHeight();
                    if (currentIndex > newIndex) {
                        return true;
                    }
                    let fv = $("#requesterDetails").data("formValidation"),
                        $container = $("#requesterDetails").find(
                            'fieldset[data-step="' + currentIndex + '"]',
                        );
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
                        $("#durationMeeting").html(
                            $("#meetingDuration").val() +
                            " " +
                            $("#meetingDurationUnit").val(),
                        );
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
                            content +=
                                "<td>" +
                                $(this)
                                    .find("#item")
                                    .val() +
                                "</td>";
                            content +=
                                "<td>" +
                                $(this)
                                    .find(".unitOfmeasure")
                                    .val() +
                                "</td>";
                            content +=
                                "<td>" +
                                $(this)
                                    .find("#number")
                                    .val() +
                                "</td>";
                            content +=
                                "<td>" +
                                $(this)
                                    .find("#unit-cost")
                                    .val() +
                                "</td>";
                            content +=
                                "<td>" +
                                $(this)
                                    .find("#totalamount")
                                    .val() +
                                "</td>";
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
                        $container = $("#requesterDetails").find(
                            'fieldset[data-step="' + currentIndex + '"]',
                        );

                    // Validate the last step container
                    fv.validateContainer($container);

                    let isValidStep = fv.isValidContainer($container);
                    if (isValidStep === false || isValidStep === null) {
                        return false;
                    }

                    return true;
                },
                onFinished: function (e: any, currentIndex: number) {
                    swal({
                        title: "Are you sure?",
                        text: "You are about to submit your Resource booking request",
                        type: "warning",
                        showCancelButton: true,
                        closeOnConfirm: false,
                        showLoaderOnConfirm: true,
                        confirmButtonText: "Submit",
                        confirmButtonColor: "#5cb85c",
                    }).then(function (result: any) {
                        if (result.value) {
                            ResourceBooking.prototype.PostResource();
                        }
                    });
                },
            })
            .formValidation({
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
                                message: "Room is required"
                            },
                        },
                    },
                    date: {
                        validators: {
                            notEmpty: {
                                message: "Date of meeting is required"
                            }
                        },
                    },
                    meetingName: {
                        validators: {
                            notEmpty: {
                                message: "Name of meeting must be included"
                            }
                        },
                    },
                    start: {
                        validators: {
                            notEmpty: {
                                message: "Start time is required"
                            }
                        },
                    },
                    end: {
                        validators: {
                            notEmpty: {
                                message: "End time is required"
                            }
                        },
                    },
                },
            })
            .on("success.form.fv", function (e: any) {
                e.preventDefault();
                ResourceBooking.prototype.PostResource();
            });
    }
}

$.fn.dataTable.ext.search.push(
    function (settings: any, data: any, dataIndex: any) {
        if (settings.nTable.id !== "reportstable") {
            return true;
        }
        let date_from = moment("01-01-1000", "DD-MM-YYYY");
        let the_date = moment().format("DD-MM-YYYY");
        let date_to = moment().endOf("year");

        if ($("#filter_date_from").val() !== "") {
            date_from = moment($("#filter_date_from").val(), "DD-MM-YYYY");
        }
        if ($("#filter_date_to").val() !== "") {
            date_to = moment($("#filter_date_to").val(), "DD-MM-YYYY");
        }
        if (data[3] !== "") {
            the_date = data[3];
        }
        let loc = moment(the_date, "DD-MM-YYYY");

        if (loc.isSameOrAfter(date_from) && loc.isSameOrBefore(date_to)) {
            return true;
        }
        return false;
    },
);


$(document).ready(function () {
    let resourceBooking = new ResourceBooking();
    resourceBooking.initForm();
    resourceBooking.GetIsApprover();
    $("#requesterName").val(_spPageContextInfo.userDisplayName);
    $("#datepicker").datetimepicker({
        format: "DD-MM-YYYY",
        minDate: moment(),
        useCurrent: false,
    });
    $("#datepicker2,#to").datetimepicker({
        format: "DD-MM-YYYY",
    });
    $("#datepicker2,#to").on("change.datetimepicker", function (e) {
       $("#reportstable").dataTable().fnDraw();
    });
    $("input.upload").on("change", function () {
        const path = $(this).val(), filename = path.substr(path.lastIndexOf("\\") + 1);
        $(this).closest(".input-group").find(".inputFiles").val(filename);
    });
    $("#starttimepicker").datetimepicker({ format: "LT" });
    $("#endtimepicker").datetimepicker({
        format: "LT",
        useCurrent: false,
    });
    $("#starttimepicker").on("change.datetimepicker", function (e) {
        $("#endtimepicker").datetimepicker("minDate", e.date);
        let start = $("#starttimepicker").val();
        let end = $("#endtimepicker").val();
        if (start !== "" && end !== "") {
            meetingDuration.text(resourceBooking.TimeDifference(start, end));

        }
    });
    $("#endtimepicker").on("change.datetimepicker", function (e) {
        $("#starttimepicker").datetimepicker("maxDate", e.date);
        let start = $("#starttimepicker").val();
        let end = $("#endtimepicker").val();
        if (start !== "" && end !== "") {
            meetingDuration.text(resourceBooking.TimeDifference(start, end));

        }
    });
    $("select[name='unitofmeasure[]']").select2({
        tags: true,
    });
    $("#btnadd").on("click", function () {
        $("#tableItems tr:last").after(
            '<tr><td><input type="text" class="form-control" name="item[]" id="item"></td><td>' +
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
            '<td><input type="text" name="totalamount[]" id="totalamount" class="form-control subtotal" readonly></td></tr>',
        );
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
    });
    let i = $("#tableItems tr").length;
    $("#btnremove").on("click", function () {
        if (i > 2) {
            let $itemoption = $("#tableItems tr:last").find('[name="item[]"]');
            let $unitoption = $("#tableItems tr:last").find(
                '[name="unitofmeasure[]"]',
            );
            let $numberoption = $("#tableItems tr:last").find('[name="number[]"]');
            let $unitCostoption = $("#tableItems tr:last").find(
                '[name="unit-cost[]"]',
            );
            let $totaloption = $("#tableItems tr:last").find(
                '[name="totalamount[]"]',
            );

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
                total_pre += parseInt(
                    $(val)
                        .val()
                        .replace(/,/g, ""),
                );
            });

            $("#totalcost").text(
                total_pre.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"),
            );
        }
    });

    $("#admintable").on("click", ".btn-uploadModal", function () {
        let id = $("this").data("id");
        $("#upload-id").val(id);
        $("#uploadModal").modal("show");
    });

    $(".btn-upload").click(function () {
        let id = $("this").data("id");
        $("#upload-id").val(id);
        $("#uploadModal").modal("show");
    });

    $("#admintable").on("click", ".view-resource", function () {
        let id = $(this).data("id");
        resourceBooking.GetResource(id);
    });

    $(".content").on("keyup", ".unitcost", function () {
        let cost = $(this).val();
        let quantity = $(this)
            .closest("td")
            .prev()
            .find(".quantity")
            .val();
        if (cost && quantity) {
            $(this)
                .closest("td")
                .next()
                .find(".subtotal")
                .val((cost * quantity).toFixed(2));
            let total_pre = 0;
            $(".subtotal").each(function (index, val) {
                total_pre += parseInt(
                    $(val)
                        .val()
                        .replace(/,/g, ""),
                );
            });

            $("#totalcost").text(total_pre.toFixed(2));
        }
    });

    $(".content").on("keyup", ".quantity", function () {
        let quantity = $(this).val();
        let cost = $(this)
            .closest("td")
            .next()
            .find(".unitcost")
            .val();
        if (cost && quantity) {
            $(this)
                .closest("td")
                .next()
                .next()
                .find(".subtotal")
                .val((cost * quantity).toFixed(2));
            let total_pre = 0;
            $(".subtotal").each(function (index, val) {
                // tslint:disable-next-line:radix
                total_pre += parseInt(
                    $(val)
                        .val()
                        .replace(/,/g, ""),
                );
            });
            $("#totalcost").text(total_pre.toFixed(2));
        }
    });
});
