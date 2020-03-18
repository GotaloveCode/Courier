var listUrl = "/_api/web/lists/getbytitle";
var staffurl = _spPageContextInfo.webAbsoluteUrl +
    listUrl +
    "('StaffRequisition')/items";
var parentUrl = "https://egpafkenya.sharepoint.com/sites/egpafke";
var Role = "";
var Interviewee = (function () {
    function Interviewee() {
    }
    return Interviewee;
}());
var Staff = (function () {
    function Staff() {
    }
    return Staff;
}());
var CRUD = (function () {
    function CRUD() {
    }
    CRUD.prototype.PostJson = function (endpointUri, payload, success) {
        $.ajax({
            contentType: "application/json;odata=verbose",
            headers: {
                Accept: "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            },
            data: JSON.stringify(payload),
            error: CRUD.prototype.OnError,
            success: success,
            type: "POST",
            url: endpointUri
        });
    };
    CRUD.prototype.UpdateJson = function (Uri, payload, success) {
        $.ajax({
            url: Uri,
            type: "POST",
            data: JSON.stringify(payload),
            contentType: "application/json;odata=verbose",
            headers: {
                Accept: "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "X-HTTP-Method": "MERGE",
                "If-Match": "*",
            },
            success: success,
            error: CRUD.prototype.OnError,
        });
    };
    CRUD.prototype.OnError = function (error) {
        swal("Error", error.responseText, "error");
        if (error.status === 403) {
            UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
        }
    };
    CRUD.prototype.RestCalls = function (u, f) {
        return $.ajax({
            url: u,
            method: "GET",
            headers: { Accept: "application/json; odata=verbose" },
            success: function (data) {
                f(data.d);
            },
            error: CRUD.prototype.OnError
        });
    };
    CRUD.prototype.GetIsApprover = function () {
        var approverUrl = _spPageContextInfo.webAbsoluteUrl +
            listUrl +
            "('StaffAdmin')/items?$select=Role&$filter=AdminId eq " +
            _spPageContextInfo.userId;
        CRUD.prototype.RestCalls(approverUrl, CRUD.prototype.GetAdminRequests);
    };
    CRUD.prototype.GetFundingSources = function () {
        var projectsUrl = "https://egpafkenya.sharepoint.com/sites/egpafke" +
            listUrl +
            "('Projects')/items?$select=Title&$orderby=Title asc";
        CRUD.prototype.RestCalls(projectsUrl, success);
        function success(d) {
            var option = "<option val=' '></option>";
            if (d.results.length > 0) {
                $.each(d.results, function (i, j) {
                    option += "<option val='" + j.Title + "'>" + j.Title + "</option>";
                });
            }
            $("select.position_funding").html(option);
        }
    };
    CRUD.prototype.GetAdminRequests = function (d) {
        var IsAdmin = false;
        if (d.results.length > 0) {
            IsAdmin = true;
            $.each(d.results, function (k, v) {
                Role += v.Role + ",";
            });
            $("#sidebar .nav-item").removeClass("d-none");
        }
        var deptUrl = _spPageContextInfo.webAbsoluteUrl +
            listUrl +
            "('Department')/items?$select=Department&$orderby=Department asc";
        CRUD.prototype.RestCalls(deptUrl, CRUD.prototype.PopulateDepartment);
        var batchExecutor = new RestBatchExecutor(_spPageContextInfo.webAbsoluteUrl, {
            "X-RequestDigest": $("#__REQUESTDIGEST").val()
        });
        var batchRequest = new BatchRequest();
        var commands = [];
        batchRequest.endpoint = deptUrl;
        batchRequest.headers = { accept: "application/json;odata=nometadata" };
        commands.push({
            id: batchExecutor.loadRequest(batchRequest),
            title: "PopulateDepartment",
        });
        if (IsAdmin) {
            var adminurl = staffurl +
                "?$select=Id,DateNeeded,Author/Title,Department,SourcesOfPosting,PositionToFill,Status," +
                "HRStatus,CountryDirectorStatus,FinanceStatus,SupervisorStatus,HeadOfOperationsStatus," +
                "AttachmentFiles,AttachmentFiles/ServerRelativeUrl,AttachmentFiles/FileName&$expand=Author,AttachmentFiles";
            batchRequest.endpoint = adminurl;
            batchRequest.headers = { accept: "application/json;odata=nometadata" };
            commands.push({
                id: batchExecutor.loadRequest(batchRequest),
                title: "populateTables",
            });
        }
        else {
            var adminurl = staffurl +
                "?$select=Id,DateNeeded,Author/Title,Department,SourcesOfPosting,PositionToFill,Status," +
                "HRStatus,CountryDirectorStatus,FinanceStatus,SupervisorStatus,HeadOfOperationsStatus," +
                "AttachmentFiles,AttachmentFiles/ServerRelativeUrl,AttachmentFiles/FileName&$expand=Author,AttachmentFiles" +
                "&$filter=SupervisorId eq " + _spPageContextInfo.userId;
            batchRequest = new BatchRequest();
            batchRequest.endpoint = adminurl;
            batchRequest.headers = { accept: "application/json;odata=nometadata" };
            commands.push({
                id: batchExecutor.loadRequest(batchRequest),
                title: "getSupervisor",
            });
        }
        batchExecutor
            .executeAsync()
            .done(function (result) {
            $.each(result, function (k, v) {
                var command = $.grep(commands, function (c) {
                    return v.id === c.id;
                });
                if (command[0].title === "populateTables") {
                    populateTables(v.result.result.value);
                }
                if (command[0].title === "getSupervisor") {
                    getSupervisor(v.result.result.value);
                }
                if (command[0].title === "PopulateDepartment") {
                    CRUD.prototype.PopulateDepartment(v.result.result.value);
                }
            });
        })
            .fail(function (err) {
            CRUD.prototype.OnError(err);
        });
        function populateTables(dt) {
            var rptrow = "", adminrow = "";
            if (dt) {
                $.each(dt, function (i, j) {
                    rptrow +=
                        "<tr><td>" +
                            moment(j.DateNeeded).format("DD/MM/YYYY") +
                            "</td><td>" +
                            j.Author.Title +
                            "</td>" +
                            "<td>" +
                            CRUD.prototype.GetAttachmentLinks(j.AttachmentFiles) +
                            "</td><td>" +
                            j.Department +
                            "</td><td>" +
                            j.SourcesOfPosting +
                            "</td><td>" +
                            j.PositionToFill +
                            "</td><td>" +
                            j.Status +
                            "</td><td><a href='#' class='btn btn-primary view-detail' data-id='" +
                            j.Id +
                            "'>View</a></td></tr>";
                    if (j.Status !== "Approved" && j[CRUD.prototype.GetUserRoleStatus()] === "Pending") {
                        adminrow +=
                            "<tr><td>" +
                                moment(j.DateNeeded).format("DD/MM/YYYY") +
                                "</td><td>" +
                                j.Author.Title +
                                "</td>" +
                                "<td>" +
                                CRUD.prototype.GetAttachmentLinks(j.AttachmentFiles) +
                                "</td><td>" +
                                j.Department +
                                "</td><td>" +
                                j.SourcesOfPosting +
                                "</td><td>" + j.PositionToFill + "</td><td>" +
                                j.Status + "</td><td><a href='#' class='btn btn-primary view-detail' data-id='" +
                                j.Id +
                                "'>View</a></td></tr>";
                    }
                });
            }
            $("#reportinfo>tbody").html(rptrow);
            $("#admininfo>tbody").html(adminrow);
            $("#admininfo,#reportinfo").dataTable({ responsive: true });
        }
        function getSupervisor(dt) {
            if (dt.length > 0) {
                Role += "Supervisor";
                $("#sidebar .nav-item").removeClass("d-none");
                populateTables(dt);
            }
        }
    };
    CRUD.prototype.GetUserRoleStatus = function () {
        var status = "";
        if (Role.indexOf("Supervisor") !== -1) {
            status = "SupervisorStatus";
        }
        if (Role.indexOf("Finance") !== -1) {
            status = "FinanceStatus";
        }
        if (Role.indexOf("Head Of Operations") !== -1) {
            status = "HeadOfOperationsStatus";
        }
        if (Role.indexOf("Country Director") !== -1) {
            status = "CountryDirectorStatus";
        }
        if (Role.indexOf("Human Resource") !== -1) {
            status = "HRStatus";
        }
        return status;
    };
    CRUD.prototype.GetAllUsers = function () {
        var memberUrl = parentUrl +
            "/_api/web/sitegroups/getbyname('EGPAF Members')/users?$select=Title,Id";
        CRUD.prototype.RestCalls(memberUrl, populateUsers);
        function populateUsers(d) {
            var content = "<option value=' '></option>";
            if (d.results) {
                $.each(d.results, function (i, j) {
                    content += "<option value=" + j.Id + ">" + j.Title + "</option>";
                });
            }
            $("#dotting_line,#interviewer")
                .empty()
                .append(content);
            $("#dotting_line,#interviewer").chosen({ allow_single_deselect: true });
        }
    };
    CRUD.prototype.UploadDocument = function (id) {
        var listName = "StaffRequisition";
        var fileInput = $("#doc_file");
        CRUD.prototype.UploadFileSP(listName, id, fileInput[0].files[0]);
    };
    CRUD.prototype.PostStaff = function () {
        var staff = new Staff();
        staff.Abilities = $("#abilities").val();
        var budget = $("#amount_budget").val();
        if (budget) {
            budget = removeCommas($("#amount_budget").val());
        }
        staff.AmountBudgeted = budget;
        staff.BeginningDate = moment($("input[name=date2]").val(), "DD/MM/YYYY").toISOString();
        staff.Certificates = $("#certificate").val();
        staff.ContigencyFundingRequest = $("#contigency").val();
        staff.DateNeeded = moment($("input[name=replacement_date]").val(), "DD/MM/YYYY").toISOString();
        staff.Department = $("#department").val();
        staff.DottingLineManagerId = $("#dotting_line").val();
        staff.Education = $("#education").val();
        staff.Experience = $("#experience").val();
        staff.Knowledge = $("#knowledge").val();
        var numberval = $("input[name='number_length']").val();
        if (numberval === "") {
            numberval = 1;
        }
        staff.LengthOfContract = numberval + " " + $("select[name='period']").val();
        staff.OfficeSeatingLocation = $("#office_seating").val();
        staff.Position = $("input[name='radio']:checked").val();
        var pobudget = false;
        if ($("input[name='position_budget']:checked").val() === "Yes") {
            pobudget = true;
        }
        staff.PositionBudgeted = pobudget;
        staff.PositionToFill = $("#position_fill").val();
        staff.SiteLocation = $("#site_location").val();
        staff.Skills = $("#skills").val();
        staff.SourcesOfPosting = $("#sources").val();
        var data = {
            __metadata: { type: "SP.Data.StaffRequisitionListItem" },
        };
        data = $.extend(data, staff);
        CRUD.prototype.PostJson(staffurl, data, postOtherData);
        function postOtherData(d) {
            if ($("#doc_file").val() !== "") {
                UploadDocument(d.d.Id);
            }
            var batchExecutor = new RestBatchExecutor(_spPageContextInfo.webAbsoluteUrl, {
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            });
            var commands = [];
            var batchRequest = new BatchRequest();
            var Interviewees = new Array();
            var item = $("#interviewer").val();
            for (var index = 0; index < item.length; index++) {
                var interviewee = new Interviewee();
                interviewee.RequisitionId = d.d.Id;
                interviewee.IntervieweeId = item[index];
                Interviewees.push(interviewee);
            }
            var Intervieweesurl = _spPageContextInfo.webAbsoluteUrl +
                listUrl +
                "('Interviewees')/items";
            for (var index = 0; index < Interviewees.length; index++) {
                var postdata = {
                    __metadata: { type: "SP.Data.IntervieweesListItem", }
                };
                postdata = $.extend(postdata, Interviewees[index]);
                batchRequest.payload = postdata;
                batchRequest.verb = "POST";
                batchRequest.endpoint = Intervieweesurl;
                commands.push({
                    id: batchExecutor.loadChangeRequest(batchRequest),
                    title: "postInterviewees" + index
                });
            }
            var fundingsourceUrl = _spPageContextInfo.webAbsoluteUrl +
                listUrl +
                "('FundingSource')/items";
            $("table.fundingItems tbody tr").each(function (index, value) {
                var tr = $(this);
                var postdata = {
                    __metadata: { type: "SP.Data.FundingSourceListItem" },
                    Source: tr.find(".position_funding").val(),
                    PercentBySource: tr.find(".by_source").val(),
                    RequisitionId: d.d.Id,
                };
                batchRequest.payload = postdata;
                batchRequest.verb = "POST";
                batchRequest.endpoint = fundingsourceUrl;
                commands.push({
                    id: batchExecutor.loadChangeRequest(batchRequest),
                    title: "postFundingSources" + index
                });
            });
            batchExecutor.executeAsync().done(function (result) {
                var i = 0;
                $.each(result, function (k, v) {
                    i++;
                    var command = $.grep(commands, function (c) {
                        return v.id === c.id;
                    });
                    if (command[0].title === "postInterviewees0") {
                        swal("success", "Resource booked successfully", "success");
                    }
                    if (command[0].title === "postFundingSources0") {
                        console.log(v.results.results.value);
                    }
                });
            });
        }
    };
    CRUD.prototype.GetStaff = function (id, view) {
        $("#hidden-id").val(id);
        var staffresUrl = staffurl +
            "?$select=Created,Author/Title,PositionToFill,Position,Department," +
            "OfficeSeatingLocation,DottingLineManager/Title,SourcesOfPosting,LengthOfContract," +
            "PositionBudgeted,SiteLocation,BeginningDate,AmountBudgeted," +
            "ContigencyFundingRequest,DateNeeded,Knowledge,Skills,Abilities,Education,Experience," +
            "Certificates,ReplacementFor,Status,Id," +
            "HRStatus,CountryDirectorStatus,FinanceStatus,SupervisorStatus,HeadOfOperationsStatus," +
            "AttachmentFiles,AttachmentFiles/ServerRelativeUrl,AttachmentFiles/FileName" +
            "&$expand=Author,AttachmentFiles,DottingLineManager&$filter=Id eq " +
            id;
        var intervUrl = _spPageContextInfo.webAbsoluteUrl +
            listUrl +
            "('Interviewees')/items?$select=Interviewee/Title&$expand=Interviewee&$filter=RequisitionId eq " +
            id;
        var fundUrl = _spPageContextInfo.webAbsoluteUrl +
            listUrl +
            "('FundingSource')/items?$select=Source,PercentBySource&$filter=RequisitionId eq " +
            id;
        var batchExecutor = new RestBatchExecutor(_spPageContextInfo.webAbsoluteUrl, {
            "X-RequestDigest": $("#__REQUESTDIGEST").val()
        });
        var batchRequest = new BatchRequest();
        var commands = [];
        batchRequest.endpoint = staffresUrl;
        batchRequest.headers = { accept: "application/json;odata=nometadata" };
        commands.push({
            id: batchExecutor.loadRequest(batchRequest),
            title: "getStaffRes",
        });
        batchRequest.endpoint = intervUrl;
        batchRequest.headers = { accept: "application/json;odata=nometadata" };
        commands.push({
            id: batchExecutor.loadRequest(batchRequest),
            title: "getInterviewees"
        });
        batchRequest.endpoint = fundUrl;
        batchRequest.headers = { accept: "application/json;odata=nometadata" };
        commands.push({
            id: batchExecutor.loadRequest(batchRequest),
            title: "getFundingSources",
        });
        batchExecutor
            .executeAsync()
            .done(function (result) {
            $.each(result, function (k, v) {
                var command = $.grep(commands, function (c) {
                    return v.id === c.id;
                });
                if (command[0].title === "getStaffRes") {
                    GetStaffRes(v.result.result.value);
                }
                if (command[0].title === "getInterviewees") {
                    GetInterviewees(v.result.result.value);
                }
                if (command[0].title === "getFundingSources") {
                    GetFundingSources(v.result.result.value);
                }
            });
        })
            .fail(function (err) {
            CRUD.prototype.OnError(err);
        });
        function GetStaffRes(d) {
            if (d.length > 0) {
                $.each(d, function (i, j) {
                    $("#m-created-date").text(moment(j.Created).format("DD-MM-YYYY"));
                    $("#m-meeting-date").text(moment(j.MeetingDate).format("DD-MM-YYYY"));
                    $("#position-to-fill").text(j.PositionToFill);
                    $("#m-position").text(j.Position);
                    $("#m-department").text(j.Department);
                    $("#m-site-location").text(j.SiteLocation);
                    $("#m-department").text(j.Department);
                    $("#m-office").text(j.OfficeSeatingLocation);
                    $("#m-hiring-manager").text(j.Author.Title);
                    $("#m-dotting-line-manager").text(j.DottingLineManager.Title);
                    $("#m-posting-source").text(j.SourcesOfPosting);
                    $("#m-job-description").text(CRUD.prototype.GetAttachmentLinks(j.AttachmentFiles));
                    $("#m-length-of-contract").text(j.LengthOfContract);
                    var posbudget = "Yes";
                    if (!j.PositionBudgeted) {
                        posbudget = "No";
                        $("#m-contigency").text(j.ContigencyFundingRequest);
                        $("#m-yes-budgeted").addClass("d-none");
                    }
                    else {
                        $("#m-no-budgeted").removeClass("d-none");
                        $("#m-amount-budgeted").text(addCommas(j.AmountBudgeted));
                        $("#m-beginning-date").text(moment(j.BeginningDate).format("DD-MM-YYYY"));
                    }
                    $("#m-position-budgeted").text(posbudget);
                    $("#m-replacement-for").text(j.ReplacementFor);
                    $("#m-date-needed").text(moment(j.DateNeeded).format("DD-MM-YYYY"));
                    $("#m-knowledge").text(j.Knowledge);
                    $("#m-skills").text(j.Skills);
                    $("#m-abilities").text(j.Abilities);
                    $("#m-education").text(j.Education);
                    $("#m-experience").text(j.Experience);
                    $("#m-certificates").text(j.Certificates);
                    if (j.HRStatus === "Pending") {
                        $("#reviewer-status").val("Human Resource");
                    }
                    if (j.CountryDirectorStatus === "Pending") {
                        $("#reviewer-status").val("Country Director");
                    }
                    if (j.HeadOfOperationsStatus === "Pending") {
                        $("#reviewer-status").val("Head Of Operations");
                    }
                    if (j.FinanceStatus === "Pending") {
                        $("#reviewer-status").val("Finance");
                    }
                    if (j.SupervisorStatus === "Pending") {
                        $("#reviewer-status").val("Supervisor");
                    }
                    EnableApproverButton(j);
                });
            }
            $("#reviewdetails").modal();
        }
        function EnableApproverButton(j) {
            $("#btn-approve,#btn-reject").addClass("d-none");
            $("#comment").val(j.Comment).prop("disabled", true);
            if (Role.indexOf("Supervisor") !== -1
                && j.SupervisorStatus === "Pending"
                && view === "Admin") {
                $("#btn-approve,#btn-reject").removeClass("d-none");
                $("#comment")
                    .val(j.Comment)
                    .prop("disabled", false);
            }
            if (Role.indexOf("Finance") !== -1
                && j.FinanceStatus === "Pending"
                && j.SupervisorStatus === "Approved"
                && view === "Admin") {
                $("#btn-approve,#btn-reject").removeClass("d-none");
                $("#comment")
                    .val(j.Comment)
                    .prop("disabled", false);
            }
            if (Role.indexOf("Head Of Operations") !== -1
                && j.FinanceStatus === "Approved"
                && j.HeadOfOperationsStatus === "Pending"
                && view === "Admin") {
                $("#btn-approve,#btn-reject").removeClass("d-none");
                $("#comment")
                    .val(j.Comment)
                    .prop("disabled", false);
            }
            if (Role.indexOf("Country Director") !== -1
                && j.HeadOfOperationsStatus === "Approved"
                && j.CountryDirectorStatus === "Pending"
                && view === "Admin") {
                $("#btn-approve,#btn-reject").removeClass("d-none");
                $("#comment")
                    .val(j.Comment)
                    .prop("disabled", false);
            }
            if (Role.indexOf("Human Resource") !== -1
                && j.HRStatus === "Pending"
                && j.CountryDirectorStatus === "Approved"
                && view === "Admin") {
                $("#btn-approve,#btn-reject").removeClass("d-none");
                $("#comment")
                    .val(j.Comment)
                    .prop("disabled", false);
            }
            if (j.Status === "Approved"
                && Role.indexOf("Human Resource") !== -1
                && view === "Admin") {
                $("#comment")
                    .val(j.Comment)
                    .prop("disabled", false);
            }
        }
        function GetInterviewees(d) {
            if (d.length > 0) {
                var names_1 = "";
                $.each(d, function (i, j) {
                    names_1 += j.Interviewee.Title + ", ";
                });
                if (names_1.length > 2) {
                    names_1.slice(0, -2);
                }
                $("#m-interviewers").text(names_1);
            }
        }
        function GetFundingSources(d) {
            if (d.length > 0) {
                var row_1 = "";
                $.each(d, function (i, j) {
                    row_1 +=
                        "<tr><td>" +
                            j.Source +
                            "</td><td>" +
                            j.PercentBySource +
                            "</td></tr>";
                });
                $("#m-tbsource>tbody").html(row_1);
            }
        }
    };
    CRUD.prototype.GetAttachmentLinks = function (Attachments) {
        var links = "";
        $.each(Attachments, function (i, j) {
            if (j.ServerRelativeUrl) {
                links +=
                    '<a target="_blank" href="' +
                        j.ServerRelativeUrl +
                        '"><span class="fa fa-paperclip"></span>' +
                        j.FileName +
                        "</a>";
            }
        });
        return links;
    };
    CRUD.prototype.UpdateStatus = function () {
        var status = $("#submit-type").val();
        var data = {
            __metadata: { type: "SP.Data.StaffRequisitionListItem" },
        };
        if (status === "Rejected") {
            data.Status = status;
        }
        ApproverStatus();
        function ApproverStatus() {
            switch ($("#reviewer-status").val()) {
                case "Supervisor":
                    data.SupervisorStatus = status;
                    data.SupervisorComment = $("#comment").val();
                    break;
                case "Finance":
                    data.FinanceStatus = status;
                    data.FinanceComment = $("#comment").val();
                    break;
                case "Human Resource":
                    data.HRStatus = status;
                    data.Status = status;
                    data.HRComment = $("#comment").val();
                    break;
                case "Head Of Operations":
                    data.HeadOfOperationsStatus = status;
                    data.HeadOfOperationsComment = $("#comment").val();
                    break;
                case "Country Director":
                    data.CountryDirectorStatus = status;
                    data.CountryDirectorComment = $("#comment").val();
                    break;
            }
        }
        CRUD.prototype.UpdateJson(staffurl + "(" + $("#hidden-id").val() + ")", data, success);
        function success() {
            if (status === "Approved") {
                swal({
                    title: "Success",
                    text: "Request " + status + " successfully",
                    type: "success",
                }, function () {
                    $("#reviewdetails").modal("hide");
                    location.reload();
                });
            }
            else {
                swal({
                    title: "Success",
                    text: "Request " + status + " successfully",
                    type: "success",
                }, function () {
                    $("#reviewdetails").modal("hide");
                    location.reload();
                });
            }
        }
    };
    CRUD.prototype.UploadFileSP = function (listName, id, file) {
        function GetFileBuffer(docfile) {
            var dfd = $.Deferred();
            var reader = new FileReader();
            reader.onload = function (e) {
                dfd.resolve(e.target.result);
            };
            reader.onerror = function (e) {
                dfd.reject(e.target.error);
            };
            reader.readAsArrayBuffer(docfile);
            return dfd.promise();
        }
        var deferred = $.Deferred();
        GetFileBuffer(file).then(function (buffer) {
            var bytes = new Uint8Array(buffer);
            var binary = "";
            for (var b = 0; b < bytes.length; b++) {
                binary += String.fromCharCode(bytes[b]);
            }
            var scriptbase = _spPageContextInfo.webServerRelativeUrl + "/_layouts/15/";
            console.log(" File size:" + bytes.length);
            $.getScript(scriptbase + "SP.RequestExecutor.js", function () {
                var createitem = new SP.RequestExecutor(_spPageContextInfo.webServerRelativeUrl);
                createitem.executeAsync({
                    url: _spPageContextInfo.webServerRelativeUrl +
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
                    state: "Update",
                });
                function fsucc(data) {
                    console.log("File uploaded successfully");
                    deferred.resolve(data);
                }
                function ferr(data) {
                    console.log("error", "file not uploaded error", "error");
                    deferred.reject(data);
                }
            });
        }, function (err) {
            deferred.reject(err);
        });
        return deferred.promise();
    };
    CRUD.prototype.PopulateDepartment = function (d) {
        var option = "<option val=' '></option>";
        $.each(d, function (i, j) {
            option += "<option val='" + j.Department + "'>" + j.Department + "</option>";
        });
        $("#department").html(option).chosen({ width: "100%" });
        $("#department").trigger("chosen:updated");
    };
    return CRUD;
}());
var StaffUI = (function () {
    function StaffUI() {
    }
    StaffUI.prototype.prepForm = function () {
        $("#requisitionform")
            .steps({
            headerTag: "h3",
            bodyTag: "fieldset",
            transitionEffect: "slideLeft",
            autoFocus: true,
            onStepChanging: function (e, currentIndex, newIndex) {
                adjustIframeHeight();
                if (currentIndex > newIndex) {
                    return true;
                }
                var fv = $("#requisitionform").data("formValidation");
                var $container = $("#requisitionform").find('fieldset[data-step="' + currentIndex + '"]');
                fv.validateContainer($container);
                var isValidStep = fv.isValidContainer($container);
                if (isValidStep === false || isValidStep === null) {
                    return false;
                }
                if (currentIndex === 3 && newIndex === 4) {
                    bindItems();
                }
                return true;
            },
            onFinishing: function (e, currentIndex) {
                swal({
                    title: "Submit Request",
                    text: "Are you sure you want to submit?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonClass: "btn-danger",
                    confirmButtonText: "Yes",
                    closeOnConfirm: false,
                    showLoaderOnConfirm: true,
                }, function () {
                    CRUD.prototype.PostStaff();
                });
            },
            onFinished: function (e, currentIndex) { },
            labels: { finish: "Submit" },
        })
            .formValidation({
            framework: "bootstrap",
            excluded: [":disabled", ":hidden"],
            icon: {
                valid: "fa fa-ok",
                invalid: "fa fa-remove",
                validating: "fa fa-refresh",
            },
            fields: {
                beginning_date: {
                    enabled: true,
                    validators: {
                        notEmpty: {
                            message: "The date is required",
                        },
                        date: {
                            format: "DD/MM/YYYY",
                            message: "The date is not valid",
                        },
                    },
                },
                replacement_date: {
                    validators: {
                        notEmpty: {
                            message: "The date is required"
                        },
                        date: {
                            format: "DD/MM/YYYY",
                            message: "The date is not valid"
                        },
                    },
                },
                position_fill: {
                    validators: {
                        notEmpty: { message: "The position to fill is required" }
                    },
                },
                department: {
                    validators: {
                        notEmpty: { message: "The department name is required" }
                    },
                },
                location: {
                    validators: {
                        notEmpty: { message: "The Delivery location is required" }
                    },
                },
                site_location: {
                    validators: {
                        notEmpty: { message: "The site location is required" }
                    },
                },
                office_seating: {
                    validators: {
                        notEmpty: { message: "The office seating location is required" }
                    },
                },
                interviewer: {
                    validators: {
                        notEmpty: { message: "The interviewer(s) is required" },
                    },
                },
                sources: {
                    validators: {
                        notEmpty: { message: "The source(s) for posting is required" },
                    },
                },
                choose: {
                    validators: { notEmpty: { message: "Choose one of the following" } },
                },
                contigency: {
                    enabled: true,
                    validators: {
                        notEmpty: {
                            message: "The reason for contigency funding is required",
                        },
                    },
                },
                replacement_for: {
                    validators: {
                        notEmpty: { message: "Insert the replacement position" }
                    }
                },
                knowledge: {
                    validators: {
                        notEmpty: { message: "Please fill the Knowledge requirements" }
                    }
                },
                skills: {
                    validators: {
                        notEmpty: { message: "Please fill the Skills requirements" }
                    }
                },
                abilities: {
                    validators: {
                        notEmpty: { message: "Please fill the Abilities requirements " }
                    }
                },
                education: {
                    validators: {
                        notEmpty: { message: "Please fill the Education requirements" }
                    }
                },
                experience: {
                    validators: { notEmpty: { message: "Experience is  required" } }
                },
                certificate: {
                    validators: { notEmpty: { message: "Certificates are required" } }
                }
            }
        })
            .find('[name="beginning_date"]')
            .datetimepicker({
            onSelect: function (date, inst) {
                $("#requisitionform").formValidation("revalidateField", "beginning_date");
            }
        })
            .find('[name="replacement_date"]')
            .datetimepicker({
            onSelect: function (date, inst) {
                $("#requisitionform").formValidation("revalidateField", "replacement_date");
            }
        });
        $(".staff-modal")
            .formValidation({
            framework: "bootstrap",
            excluded: ":disabled",
            icon: {
                valid: "fa fa-check",
                invalid: "fa fa-times",
                validating: "fa fa-refresh",
            },
            fields: {
                comment: {
                    validators: {
                        notEmpty: { message: "The Approver comment is required" }
                    }
                }
            }
        })
            .on("success.form.fv", function (e) {
            e.preventDefault();
            swal({
                title: "Submit Request",
                text: "Are you sure you want to set the request as " +
                    $("#submit-type").val() +
                    "?",
                type: "warning",
                showCancelButton: true,
                confirmButtonClass: "btn-danger",
                confirmButtonText: "Yes",
                closeOnConfirm: false,
                showLoaderOnConfirm: true
            }, function () {
                CRUD.prototype.UpdateStatus();
            });
        });
        $("input[name=position_budget]").change(function () {
            if ($(this).val() === "No") {
                $("#m-position-budgeted").text("No");
                $(".label_no").removeClass("d-none");
                $(".label_yes").addClass("d-none");
                $("#requisitionform").formValidation("enableFieldValidators", "beginning_date", false);
                $("#requisitionform").formValidation("enableFieldValidators", "contigency", true);
                $("#beginning_date,#amount_budget").val("");
            }
            else {
                $("#m-position-budgeted").text("Yes");
                $(".label_yes").removeClass("d-none");
                $(".label_no").addClass("d-none");
                $("#requisitionform").formValidation("enableFieldValidators", "beginning_date", true);
                $("#requisitionform").formValidation("enableFieldValidators", "contigency", false);
                $("#contigency").val("");
            }
        });
        $("#replacement_for").val("N/A");
        $("input[name=radio]").change(function () {
            if ($(this).val() === "New Hire") {
                $("#replacement_for").val("N/A");
            }
            else {
                $("#replacement_for").val("");
            }
        });
        $("#amount_budget").on("input", function () {
            var value = removeCommas($(this).val());
            if ($.isNumeric(value)) {
                $(this).val(addCommas(value));
            }
            else {
                $(this).val("");
            }
        });
        $("#hiring_manager").val(_spPageContextInfo.userDisplayName);
        $("#beginning_date").datetimepicker({
            format: "DD/MM/YYYY",
            widgetPositioning: {
                horizontal: "auto",
                vertical: "bottom"
            }
        });
        $("#replacement_date").datetimepicker({
            format: "DD/MM/YYYY",
            minDate: moment(),
            useCurrent: false,
            widgetPositioning: {
                horizontal: "auto",
                vertical: "bottom"
            }
        });
        var i = $("#tableItems tr").length;
        $("#add").click(function () {
            var copyrow = $("#pos_fund_row").clone();
            $("#tableItems tr:last").after(copyrow);
            var positionfundingoption = $("tableItems tr:last").find('[name="position_funding[]"]');
            var bysourceoption = $("tableItems tr:last").find('[name="by_source[]"]');
            $("#requisitionform").formValidation("addField", positionfundingoption);
            $("#requisitionform").formValidation("addField", bysourceoption);
            i++;
        });
        $("#remove").click(function () {
            if (i > 2) {
                var positionfundingoption = $("tableItems tr:last").find('[name="position_funding[]"]');
                var bysourceoption = $("tableItems tr:last").find('[name="by_source[]"]');
                $("#requisitionform").formValidation("addField", positionfundingoption);
                $("#requisitionform").formValidation("addField", bysourceoption);
                $("#tableItems tr:last").remove();
                i--;
            }
        });
        $("#btn-approve").click(function () {
            $("#submit-type").val("Approved");
            $(".staff-modal")
                .data("formValidation")
                .validate();
        });
        $("#btn-reject").click(function () {
            $("#submit-type").val("Rejected");
            $(".staff-modal")
                .data("formValidation")
                .validate();
        });
        $("#admininfo").on("click", ".view-detail", function () {
            var id = $(this).data("id");
            CRUD.prototype.GetStaff(id, "Admin");
        });
        $("#reportinfo").on("click", ".view-detail", function () {
            var id = $(this).data("id");
            CRUD.prototype.GetStaff(id, "Report");
        });
        function adjustIframeHeight() {
            var $body = $("body"), $iframe = $body.data("iframe.fv");
            if ($iframe) {
                $iframe.height($body.height());
            }
        }
        function bindItems() {
            var position_fill = $("#position_fill").val();
            var position = $("input[name=radio]:checked").val();
            var position_budget = $("input[name=position_budget]:checked").val();
            var department = $("#department").val();
            var site_location = $("#site_location").val();
            var office_seating = $("#office_seating").val();
            var hiring_manager = _spPageContextInfo.userDisplayName;
            var dotting_line = $("#dotting_line option:selected").text();
            var interviewer = $("#interviewer option:selected").val();
            var sources = $("#sources").val();
            var description = $("#description").val();
            var length_of_contract = $("input[name='number_length']").val() +
                $("select[name='period']").val();
            var content = "";
            $("table.fundingItems tbody tr").each(function (index, value) {
                content += "<tr>";
                content +=
                    "<td>" +
                        $(this)
                            .find(".position_funding")
                            .val() +
                        "</td>";
                content +=
                    "<td>" +
                        $(this)
                            .find(".by_source")
                            .val() +
                        "</td>";
                content += "</tr>";
            });
            $("table.fundingDetails tbody")
                .empty()
                .append(content);
            var choose = $("#choose").val();
            var beginning_date = $("input[name='date2']").val();
            var amount_budget = $("#amount_budget").val();
            var contigency = $("#contigency").val();
            var replacement_for = $("#replacement_for").val();
            var replacement_date = $("input[name=replacement_date]").val();
            var knowledge = $("#knowledge").val();
            var skills = $("#skills").val();
            var abilities = $("#abilities").val();
            var education = $("#education").val();
            var experience = $("#experience").val();
            var certificate = $("#certificate").val();
            $("[bind='position_budget']").html(position_budget);
            $("[bind='position_fill']").html(position_fill);
            $("[bind='position']").html(position);
            $("[bind='department']").html(department);
            $("[bind='site_location']").html(site_location);
            $("[bind='office_seating']").html(office_seating);
            $("[bind='hiring_manager']").html(hiring_manager);
            $("[bind='dotting_line']").html(dotting_line);
            $("[bind='interviewer']").html(interviewer);
            $("[bind='sources']").html(sources);
            $("[bind='description']").html(description);
            $("[bind='length_of_contract']").html(length_of_contract);
            $("[bind='choose']").html(choose);
            $("[bind='beginning_date']").html(beginning_date);
            $("[bind='amount_budget']").html(amount_budget);
            $("[bind='contigency']").html(contigency);
            $("[bind='replacement_for']").html(replacement_for);
            $("[bind='replacement_date']").html(replacement_date);
            $("[bind='knowledge']").html(knowledge);
            $("[bind='skills']").html(skills);
            $("[bind='abilities']").html(abilities);
            $("[bind='education']").html(education);
            $("[bind='experience']").html(experience);
            $("[bind='certificate']").html(certificate);
        }
    };
    return StaffUI;
}());
var addCommas = function (input) {
    if (!input) {
        return input;
    }
    return input.toString().replace(/^([-+]?)(0?)(\d+)(.?)(\d+)$/g, function (match, sign, zeros, before, decimal, after) {
        var reverseString = function (str) {
            return str
                .split("")
                .reverse()
                .join("");
        };
        var insertCommas = function (str) {
            var reversed = reverseString(str);
            var reversedWithCommas = reversed.match(/.{1,3}/g).join(",");
            return reverseString(reversedWithCommas);
        };
        return (sign +
            (decimal
                ? insertCommas(before) + decimal + after
                : insertCommas(before + after)));
    });
};
var removeCommas = function (input) {
    return input.replace(/,/g, "");
};
$(document).ready(function () {
    var crud = new CRUD();
    var staffUI = new StaffUI();
    staffUI.prepForm();
    crud.GetAllUsers();
    crud.GetIsApprover();
    crud.GetFundingSources();
    $("input.upload").on("change", function () {
        var path = $(this).val(), filename = path.substr(path.lastIndexOf("\\") + 1);
        $(this)
            .closest(".input-group")
            .find(".inputFiles")
            .val(filename);
    });
});
