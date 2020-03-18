declare var _spPageContextInfo: any;
declare var RestBatchExecutor: any;
declare var BatchRequest: any;
declare var swal: any;
let listUrl = "/_api/web/lists/getbytitle";
let staffurl =
    _spPageContextInfo.webAbsoluteUrl +
    listUrl +
    "('StaffRequisition')/items";
let parentUrl = "https://egpafkenya.sharepoint.com/sites/egpafke";
let Role = "";
class Interviewee {
    RequisitionId: number;
    IntervieweeId: number;
    IntervieweeName: string;
}
class Staff {
    PositionToFill: string;
    Position: string;
    Department: string;
    OfficeSeatingLocation: string;
    DottingLineManagerId: number;
    SourcesOfPosting: string;
    LengthOfContract: string;
    PositionBudgeted: boolean;
    SiteLocation: string;
    BeginningDate: string;
    AmountBudgeted: number;
    ContigencyFundingRequest: string;
    DateNeeded: string;
    Knowledge: string;
    Skills: string;
    Abilities: string;
    Education: string;
    Experience: string;
    Certificates: string;
    ReplacementFor: string;
}

class CRUD {
    constructor() { }
    PostJson(endpointUri: string, payload: object, success: any) {
        $.ajax({
            contentType: "application/json;odata=verbose",
            headers: {
                Accept: "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            },
            data: JSON.stringify(payload),
            error: CRUD.prototype.OnError,
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
                "If-Match": "*",
            },
            success: success,
            error: CRUD.prototype.OnError,
        });
    }

    OnError(error: any) {
        swal("Error", error.responseText, "error");
        if (error.status === 403) {
            UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
        }
    }

    RestCalls(u: string, f: any) {
        return $.ajax({
            url: u,
            method: "GET",
            headers: { Accept: "application/json; odata=verbose" },
            success: function (data) {
                f(data.d);
            },
            error: CRUD.prototype.OnError
        });
    }

    GetIsApprover() {
        const approverUrl =
            _spPageContextInfo.webAbsoluteUrl +
            listUrl +
            "('StaffAdmin')/items?$select=Role&$filter=AdminId eq " +
            _spPageContextInfo.userId;
        CRUD.prototype.RestCalls(approverUrl, CRUD.prototype.GetAdminRequests);
    }

    GetFundingSources() {
        const projectsUrl =
            "https://egpafkenya.sharepoint.com/sites/egpafke" +
            listUrl +
            "('Projects')/items?$select=Title&$orderby=Title asc";
        CRUD.prototype.RestCalls(projectsUrl, success);
        function success(d: any) {
            let option = "<option val=' '></option>";
            if (d.results.length > 0) {
                $.each(d.results, function (i, j) {
                    option += "<option val='" + j.Title + "'>" + j.Title + "</option>";
                });
            }

            $("select.position_funding").html(option);
        }
    }

    GetAdminRequests(d: any) {
        let IsAdmin = false;
        if (d.results.length > 0) {
            IsAdmin = true;
            $.each(d.results, function (k, v) {
                Role += v.Role + ",";
            });
            // isAdmin
            $("#sidebar .nav-item").removeClass("d-none");
        }

        let deptUrl = _spPageContextInfo.webAbsoluteUrl +
            listUrl +
            "('Department')/items?$select=Department&$orderby=Department asc";
        CRUD.prototype.RestCalls(deptUrl, CRUD.prototype.PopulateDepartment);

        const batchExecutor = new RestBatchExecutor(
            _spPageContextInfo.webAbsoluteUrl,
            {
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            }
        );
        let batchRequest = new BatchRequest();
        let commands: any[] = [];
        batchRequest.endpoint = deptUrl;
        batchRequest.headers = { accept: "application/json;odata=nometadata" };
        commands.push({
            id: batchExecutor.loadRequest(batchRequest),
            title: "PopulateDepartment",
        });

        if (IsAdmin) {
            let adminurl =
                staffurl +
                "?$select=Id,DateNeeded,Author/Title,Department,SourcesOfPosting,PositionToFill,Status," +
                "HRStatus,CountryDirectorStatus,FinanceStatus,SupervisorStatus,HeadOfOperationsStatus," +
                "AttachmentFiles,AttachmentFiles/ServerRelativeUrl,AttachmentFiles/FileName&$expand=Author,AttachmentFiles";
            batchRequest.endpoint = adminurl;
            batchRequest.headers = { accept: "application/json;odata=nometadata" };
            commands.push({
                id: batchExecutor.loadRequest(batchRequest),
                title: "populateTables",
            });
        } else {
            let adminurl =
                staffurl +
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
            .done(function (result: any) {
                $.each(result, function (k, v) {
                    let command = $.grep(commands, function (c: any) {
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
            .fail(function (err: any) {
                CRUD.prototype.OnError(err);
            });

        function populateTables(dt: any) {
            let rptrow = "",
                adminrow = "";
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

        function getSupervisor(dt: any) {
            if (dt.length > 0) {
                Role += "Supervisor";
                $("#sidebar .nav-item").removeClass("d-none");
                populateTables(dt);
            }
        }
    }

    GetUserRoleStatus(): string {
        let status = "";
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
    }

    GetAllUsers() {
        let memberUrl =
            parentUrl +
            "/_api/web/sitegroups/getbyname('EGPAF Members')/users?$select=Title,Id";
        CRUD.prototype.RestCalls(memberUrl, populateUsers);
        function populateUsers(d: any) {
            let content = "<option value=' '></option>";
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
    }

    UploadDocument(id: number) {
        const listName = "StaffRequisition";
        const fileInput = $("#doc_file");
        CRUD.prototype.UploadFileSP(listName, id, fileInput[0].files[0]);
    }

    PostStaff() {
        let staff = new Staff();
        staff.Abilities = $("#abilities").val();
        let budget = $("#amount_budget").val();
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
        let numberval = $("input[name='number_length']").val();
        if (numberval === "") {
            numberval = 1;
        }
        staff.LengthOfContract = numberval + " " + $("select[name='period']").val();
        staff.OfficeSeatingLocation = $("#office_seating").val();
        staff.Position = $("input[name='radio']:checked").val();
        let pobudget = false;
        if ($("input[name='position_budget']:checked").val() === "Yes") {
            pobudget = true;
        }
        staff.PositionBudgeted = pobudget;
        staff.PositionToFill = $("#position_fill").val();
        staff.SiteLocation = $("#site_location").val();
        staff.Skills = $("#skills").val();
        staff.SourcesOfPosting = $("#sources").val();
        let data: object = {
            __metadata: { type: "SP.Data.StaffRequisitionListItem" },
        };
        data = $.extend(data, staff);
        CRUD.prototype.PostJson(staffurl, data, postOtherData);

        function postOtherData(d: any) {
            if ($("#doc_file").val() !== "") {
                UploadDocument(d.d.Id);
            }
            let batchExecutor = new RestBatchExecutor(
                _spPageContextInfo.webAbsoluteUrl,
                {
                    "X-RequestDigest": $("#__REQUESTDIGEST").val()
                }
            );
            let commands: any = [];
            let batchRequest = new BatchRequest();
            let Interviewees: Array<Interviewee> = new Array();
            let item = $("#interviewer").val();
            for (let index = 0; index < item.length; index++) {
                let interviewee = new Interviewee();
                interviewee.RequisitionId = d.d.Id;
                interviewee.IntervieweeId = item[index];
                Interviewees.push(interviewee);
            }
            let Intervieweesurl =
                _spPageContextInfo.webAbsoluteUrl +
                listUrl +
                "('Interviewees')/items";
            for (let index = 0; index < Interviewees.length; index++) {
                let postdata: object = {
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
            let fundingsourceUrl =
                _spPageContextInfo.webAbsoluteUrl +
                listUrl +
                "('FundingSource')/items";
            $("table.fundingItems tbody tr").each(function (
                index: number,
                value: any
            ) {
                let tr = $(this);
                let postdata: object = {
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

            batchExecutor.executeAsync().done(function (result: any) {
                let i = 0;
                $.each(result, function (k, v) {
                    i++;
                    let command = $.grep(commands, function (c) {
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
    }

    GetStaff(id: number, view: string) {
        $("#hidden-id").val(id);
        let staffresUrl =
            staffurl +
            "?$select=Created,Author/Title,PositionToFill,Position,Department," +
            "OfficeSeatingLocation,DottingLineManager/Title,SourcesOfPosting,LengthOfContract," +
            "PositionBudgeted,SiteLocation,BeginningDate,AmountBudgeted," +
            "ContigencyFundingRequest,DateNeeded,Knowledge,Skills,Abilities,Education,Experience," +
            "Certificates,ReplacementFor,Status,Id," +
            "HRStatus,CountryDirectorStatus,FinanceStatus,SupervisorStatus,HeadOfOperationsStatus," +
            "AttachmentFiles,AttachmentFiles/ServerRelativeUrl,AttachmentFiles/FileName" +
            "&$expand=Author,AttachmentFiles,DottingLineManager&$filter=Id eq " +
            id;

        let intervUrl =
            _spPageContextInfo.webAbsoluteUrl +
            listUrl +
            "('Interviewees')/items?$select=Interviewee/Title&$expand=Interviewee&$filter=RequisitionId eq " +
            id;
        let fundUrl =
            _spPageContextInfo.webAbsoluteUrl +
            listUrl +
            "('FundingSource')/items?$select=Source,PercentBySource&$filter=RequisitionId eq " +
            id;
        const batchExecutor = new RestBatchExecutor(
            _spPageContextInfo.webAbsoluteUrl,
            {
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            }
        );
        let batchRequest = new BatchRequest();
        let commands: any[] = [];
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
            .done(function (result: any) {
                $.each(result, function (k, v) {
                    let command = $.grep(commands, function (c: any) {
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
            .fail(function (err: any) {
                CRUD.prototype.OnError(err);
            });

        function GetStaffRes(d: any) {
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
                    let posbudget = "Yes";
                    if (!j.PositionBudgeted) {
                        posbudget = "No";
                        $("#m-contigency").text(j.ContigencyFundingRequest);
                        $("#m-yes-budgeted").addClass("d-none");
                    } else {
                        $("#m-no-budgeted").removeClass("d-none");
                        $("#m-amount-budgeted").text(addCommas(j.AmountBudgeted));
                        $("#m-beginning-date").text(
                            moment(j.BeginningDate).format("DD-MM-YYYY")
                        );
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

        function EnableApproverButton(j: any) {
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

        function GetInterviewees(d: any) {
            if (d.length > 0) {
                let names = "";
                $.each(d, function (i, j) {
                    names += j.Interviewee.Title + ", ";
                });
                if (names.length > 2) {
                    names.slice(0, -2);
                }
                $("#m-interviewers").text(names);
            }
        }

        function GetFundingSources(d: any) {
            if (d.length > 0) {
                let row = "";
                $.each(d, function (i, j) {
                    row +=
                        "<tr><td>" +
                        j.Source +
                        "</td><td>" +
                        j.PercentBySource +
                        "</td></tr>";
                });
                $("#m-tbsource>tbody").html(row);
            }
        }
    }

    GetAttachmentLinks(Attachments: any): string {
        let links = "";
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
    }

    UpdateStatus() {
        let status = $("#submit-type").val();
        let data: object = {
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
                swal(
                    {
                        title: "Success",
                        text: "Request " + status + " successfully",
                        type: "success",
                    },
                    function () {
                        $("#reviewdetails").modal("hide");
                        location.reload();
                    }
                );
            } else {
                swal(
                    {
                        title: "Success",
                        text: "Request " + status + " successfully",
                        type: "success",
                    },
                    function () {
                        $("#reviewdetails").modal("hide");
                        location.reload();
                    }
                );
            }
        }
    }

    UploadFileSP(listName: string, id: number, file: object) {
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
                        state: "Update",
                    });
                    function fsucc(data: any) {
                        console.log("File uploaded successfully");
                        deferred.resolve(data);
                    }
                    function ferr(data: any) {
                        console.log("error", "file not uploaded error", "error");
                        deferred.reject(data);
                    }
                });
            },
            function (err) {
                deferred.reject(err);
            }
        );
        return deferred.promise();
    }

    PopulateDepartment(d: any) {
        let option = "<option val=' '></option>";
        $.each(d, function (i, j) {
            option += "<option val='" + j.Department + "'>" + j.Department + "</option>";
        });

        $("#department").html(option).chosen({ width: "100%" });
        $("#department").trigger("chosen:updated");
    }
}

class StaffUI {
    prepForm() {
        $("#requisitionform")
            .steps({
                headerTag: "h3",
                bodyTag: "fieldset",
                transitionEffect: "slideLeft",
                autoFocus: true,
                onStepChanging: function (
                    e: any,
                    currentIndex: number,
                    newIndex: number
                ) {
                    adjustIframeHeight();
                    if (currentIndex > newIndex) {
                        return true;
                    }
                    let fv = $("#requisitionform").data("formValidation");
                    let $container = $("#requisitionform").find(
                        'fieldset[data-step="' + currentIndex + '"]'
                    );
                    fv.validateContainer($container);
                    let isValidStep = fv.isValidContainer($container);
                    if (isValidStep === false || isValidStep === null) {
                        return false;
                    }
                    if (currentIndex === 3 && newIndex === 4) {
                        bindItems();
                    }

                    return true;
                },
                onFinishing: function (e: any, currentIndex: number) {
                    swal(
                        {
                            title: "Submit Request",
                            text: "Are you sure you want to submit?",
                            type: "warning",
                            showCancelButton: true,
                            confirmButtonClass: "btn-danger",
                            confirmButtonText: "Yes",
                            closeOnConfirm: false,
                            showLoaderOnConfirm: true,
                        },
                        function () {
                            CRUD.prototype.PostStaff();
                        }
                    );
                },
                onFinished: function (e: any, currentIndex: number) { },
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
                onSelect: function (date: any, inst: any) {
                    /* Revalidate the field when choosing it from the datepicker */
                    $("#requisitionform").formValidation(
                        "revalidateField",
                        "beginning_date"
                    );
                }
            })
            .find('[name="replacement_date"]')
            .datetimepicker({
                onSelect: function (date: any, inst: any) {
                    /* Revalidate the field when choosing it from the datepicker */
                    $("#requisitionform").formValidation(
                        "revalidateField",
                        "replacement_date"
                    );
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
            .on("success.form.fv", function (e: any) {
                e.preventDefault();
                swal(
                    {
                        title: "Submit Request",
                        text:
                            "Are you sure you want to set the request as " +
                            $("#submit-type").val() +
                            "?",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonClass: "btn-danger",
                        confirmButtonText: "Yes",
                        closeOnConfirm: false,
                        showLoaderOnConfirm: true
                    },
                    function () {
                        CRUD.prototype.UpdateStatus();
                    }
                );
            });

        $("input[name=position_budget]").change(function () {
            if ($(this).val() === "No") {
                $("#m-position-budgeted").text("No");
                $(".label_no").removeClass("d-none");
                $(".label_yes").addClass("d-none");
                $("#requisitionform").formValidation(
                    "enableFieldValidators",
                    "beginning_date",
                    false
                );
                $("#requisitionform").formValidation(
                    "enableFieldValidators",
                    "contigency",
                    true
                );
                $("#beginning_date,#amount_budget").val("");
            } else {
                $("#m-position-budgeted").text("Yes");
                $(".label_yes").removeClass("d-none");
                $(".label_no").addClass("d-none");
                $("#requisitionform").formValidation(
                    "enableFieldValidators",
                    "beginning_date",
                    true
                );
                $("#requisitionform").formValidation(
                    "enableFieldValidators",
                    "contigency",
                    false
                );
                $("#contigency").val("");
            }
        });
        $("#replacement_for").val("N/A");
        $("input[name=radio]").change(function () {
            if ($(this).val() === "New Hire") {
                $("#replacement_for").val("N/A");
            } else {
                $("#replacement_for").val("");
            }
        });

        $("#amount_budget").on("input", function () {
            let value = removeCommas($(this).val());
            if ($.isNumeric(value)) {
                $(this).val(addCommas(value));
            } else {
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

        let i = $("#tableItems tr").length;
        $("#add").click(function () {
            let copyrow = $("#pos_fund_row").clone();
            $("#tableItems tr:last").after(copyrow);
            let positionfundingoption = $("tableItems tr:last").find('[name="position_funding[]"]');
            let bysourceoption = $("tableItems tr:last").find('[name="by_source[]"]');
            $("#requisitionform").formValidation("addField", positionfundingoption);
            $("#requisitionform").formValidation("addField", bysourceoption);
            i++;
        });

        $("#remove").click(function () {
            if (i > 2) {
                let positionfundingoption = $("tableItems tr:last").find('[name="position_funding[]"]');
                let bysourceoption = $("tableItems tr:last").find('[name="by_source[]"]');
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
            let id = $(this).data("id");
            CRUD.prototype.GetStaff(id, "Admin");
        });
        $("#reportinfo").on("click", ".view-detail", function () {
            let id = $(this).data("id");
            CRUD.prototype.GetStaff(id, "Report");
        });

        function adjustIframeHeight() {
            let $body = $("body"),
                $iframe = $body.data("iframe.fv");
            if ($iframe) {
                // Adjust the height of iframe
                $iframe.height($body.height());
            }
        }

        function bindItems() {
            let position_fill = $("#position_fill").val();
            let position = $("input[name=radio]:checked").val();
            let position_budget = $("input[name=position_budget]:checked").val();
            let department = $("#department").val();
            let site_location = $("#site_location").val();
            let office_seating = $("#office_seating").val();
            let hiring_manager = _spPageContextInfo.userDisplayName;
            let dotting_line = $("#dotting_line option:selected").text();
            let interviewer = $("#interviewer option:selected").val();
            let sources = $("#sources").val();
            let description = $("#description").val();
            let length_of_contract =
                $("input[name='number_length']").val() +
                $("select[name='period']").val();

            let content = "";
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

            let choose = $("#choose").val();
            let beginning_date = $("input[name='date2']").val();
            let amount_budget = $("#amount_budget").val();
            let contigency = $("#contigency").val();
            let replacement_for = $("#replacement_for").val();
            let replacement_date = $("input[name=replacement_date]").val();
            let knowledge = $("#knowledge").val();
            let skills = $("#skills").val();
            let abilities = $("#abilities").val();
            let education = $("#education").val();
            let experience = $("#experience").val();
            let certificate = $("#certificate").val();

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
    }
}

let addCommas = function (input: any) {
    if (!input) {
        return input;
    }
    // If the regex doesn't match, `replace` returns the string unmodified
    return input.toString().replace(
        // Each parentheses group (or 'capture') in this regex becomes an argument
        // to the function; in this case, every argument after 'match'
        /^([-+]?)(0?)(\d+)(.?)(\d+)$/g,
        function (
            match: any,
            sign: any,
            zeros: any,
            before: any,
            decimal: any,
            after: any
        ) {
            // Less obtrusive than adding 'reverse' method on all strings
            let reverseString = function (str: string) {
                return str
                    .split("")
                    .reverse()
                    .join("");
            };

            // Insert commas every three characters from the right
            let insertCommas = function (str: string) {
                // Reverse, because it's easier to do things from the left
                let reversed = reverseString(str);

                // Add commas every three characters
                let reversedWithCommas = reversed.match(/.{1,3}/g).join(",");

                // Reverse again (back to normal)
                return reverseString(reversedWithCommas);
            };

            // If there was no decimal, the last capture grabs the final digit, so
            // we have to put it back together with the 'before' substring
            return (
                sign +
                (decimal
                    ? insertCommas(before) + decimal + after
                    : insertCommas(before + after))
            );
        }
    );
};

let removeCommas = function (input: string) {
    return input.replace(/,/g, "");
};

$(document).ready(function () {
    let crud = new CRUD();
    let staffUI = new StaffUI();
    staffUI.prepForm();
    crud.GetAllUsers();
    crud.GetIsApprover();
    crud.GetFundingSources();
    $("input.upload").on("change", function () {
        let path = $(this).val(), filename = path.substr(path.lastIndexOf("\\") + 1);
        $(this)
            .closest(".input-group")
            .find(".inputFiles")
            .val(filename);
    });
});
