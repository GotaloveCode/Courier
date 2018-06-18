declare var _spPageContextInfo: any;
declare var RestBatchExecutor: any;
declare var BatchRequest: any;
declare var swal: any;
let listUrl = "/_api/web/lists/getbytitle";
let staffurl =
    _spPageContextInfo.webAbsoluteUrl +
    listUrl +
    "('StaffRequisition')/items";

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
    JobDescription: string;
    PositionBudgeted: boolean;
    SiteLocation: string;
    HiringManagerId: number;
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
    parentUrl = "https://egpafkenya.sharepoint.com/sites/egpafke";
    constructor() { }
    PostJson(endpointUri: string, payload: object, success: any) {
        $.ajax({
            contentType: "application/json;odata=verbose",
            headers: {
                Accept: "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            },
            data: JSON.stringify(payload),
            error: this.OnError,
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
            error: this.OnError
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
            error: this.OnError
        });
    }

    GetIsApprover() {
        const approverUrl =
            _spPageContextInfo.webAbsoluteUrl +
            listUrl +
            "('StaffAdmin')/items?$select=Id&$filter=AdminId eq " +
            _spPageContextInfo.userId;
        this.RestCalls(approverUrl, this.GetAdminRequests);
    }

    GetAdminRequests(d: any) {
        if (d.results.length > 0) {
            // isAdmin
            $("#sidebar .nav-item").removeClass("d-none");
            let adminurl =
                staffurl +
                "?$select=Id,DateNeeded,Author/Title,JobDescription,Department,SourcesOfPosting,PositionToFill,Status&$expand=Author";
            CRUD.prototype.RestCalls(adminurl, populateTables);
            function populateTables(dt: any) {
                let rptrow,
                    adminrow = "";
                if (dt.results) {
                    $.each(dt.results, function (i, j) {
                        rptrow +=
                            "<tr><td>" +
                            moment(j.DateNeeded).format("DD/MM/YYYY") +
                            "</td><td>" +
                            j.Author.Title +
                            "</td>" +
                            "<td>" +
                            j.JobDescription +
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
                            "'>View Details</a></td></tr>";
                        if (j.Status === "Pending") {
                            adminrow +=
                                "<tr><td>" +
                                moment(j.DateNeeded).format("DD/MM/YYYY") +
                                "</td><td>" +
                                j.Author.Title +
                                "</td>" +
                                "<td>" +
                                j.JobDescription +
                                "</td><td>" +
                                j.Department +
                                "</td><td>" +
                                j.SourcesOfPosting +
                                "</td><td>" +
                                j.PositionToFill +
                                "</td><td><a href='#' class='btn btn-primary view-detail' data-id='" +
                                j.Id +
                                "'>View Details</a></td></tr>";
                        }
                    });
                }
                $("#reportinfo>tbody").html(rptrow);
                $("#admininfo>tbody").html(adminrow);
                $("#admininfo,#reportinfo").dataTable({ responsive: true });
            }
        }
    }

    GetAllUsers() {
        let memberUrl =
            this.parentUrl +
            "/_api/web/sitegroups/getbyname('EGPAF Members')/users?$select=Title,Id";
        this.RestCalls(memberUrl, populateUsers);
        function populateUsers(d: any) {
            let content = "";
            if (d.results) {
                $.each(d.results, function (i, j) {
                    content += "<option value=" + j.Id + ">" + j.Title + "</option>";
                });
            }
            $("#hiring_manager,#dotting_line,#interviewer")
                .empty()
                .append(content)
                .chosen();
        }
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
        staff.HiringManagerId = $("#hiring_manager").val();
        staff.JobDescription = $("#description").val();
        staff.Knowledge = $("#knowledge").val();
        staff.LengthOfContract =
            $("input[name='number_length']").val() +
            " " +
            $("select[name='period']").val();
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
        this.PostJson(staffurl, data, postOtherData);

        function postOtherData(d: any) {
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
                    if (command[0].title === "postInterviewees1") {
                        swal("success", "Resource booked successfully", "success");
                    }
                    if (command[0].title === "postFundingSources1") {
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
            "JobDescription,PositionBudgeted,SiteLocation,HiringManager/Title,BeginningDate,AmountBudgeted," +
            "ContigencyFundingRequest,DateNeeded,Knowledge,Skills,Abilities,Education,Experience," +
            "Certificates,ReplacementFor,Comment,Status&$expand=Author,DottingLineManager,HiringManager&$Id=" +
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
            title: "getStaffRes"
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
            title: "getFundingSources"
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
                    $("#m-requester").text(j.Author.Title);
                    $("#m-created-date").text(moment(j.Created).format("DD-MM-YYYY"));
                    $("#m-meeting-date").text(moment(j.MeetingDate).format("DD-MM-YYYY"));
                    $("#position-to-fill").text(j.PositionToFill);
                    $("#m-position").text(j.Position);
                    $("#m-department").text(j.Department);
                    $("#m-site-location").text(j.SiteLocation);
                    $("#m-department").text(j.Department);
                    $("#m-office").text(j.OfficeSeatingLocation);
                    $("#m-hiring-manager").text(j.HiringManager.Title);
                    $("#m-dotting-line-manager").text(j.DottingLineManager.Title);
                    $("#m-posting-source").text(j.SourcesOfPosting);
                    $("#m-job-description").text(j.JobDescription);
                    $("#m-length-of-contract").text(j.LengthOfContract);
                    let posbudget = "Yes";
                    if (!j.PositionBudgeted) {
                        posbudget = "No";
                        $("#m-contigency").text(j.ContigencyFundingRequest);
                        $("#m-yes-budgeted,.").addClass("d-none");
                    } else {
                        $("#m-no-budgeted").removeClass("d-none");
                        $("#m-amount-budgeted").text(j.AmountBudgeted);
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
                    if (j.Status === "Pending" && view === "Admin") {
                        $("#btn-approve,#btn-reject").removeClass("d-none");
                        $("#comment")
                            .val(j.Comment)
                            .prop("disabled", false);
                    } else {
                        $("#btn-approve,#btn-reject").addClass("d-none");
                        $("#comment")
                            .val(j.Comment)
                            .prop("disabled", true);
                    }
                });
            }
            $("#reviewdetails").modal();
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

    UpdateStatus() {
        let status = $("#submit-type").val();
        let data: object = {
            __metadata: { type: "SP.Data.StaffRequisitionListItem" },
            Status: status,
            Comment: $("#comment").val(),
        };
        this.UpdateJson(staffurl + "(" + $("#hidden-id").val() + ")", data, success);

        function success() {
            if (status === "Approved") {
                swal(
                    {
                        title: "Success",
                        text: "Request " + status + " successfully",
                        type: "success"
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
                        type: "success"
                    },
                    function () {
                        $("#reviewdetails").modal("hide");
                        location.reload();
                    }
                );
            }
        }
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
                            showLoaderOnConfirm: true
                        },
                        function () {
                            CRUD.prototype.PostStaff();
                        }
                    );
                },
                onFinished: function (e: any, currentIndex: number) { },
                labels: { finish: "Submit" }
            })
            .formValidation({
                framework: "bootstrap",
                excluded: [":disabled", ":hidden"],
                icon: {
                    valid: "fa fa-ok",
                    invalid: "fa fa-remove",
                    validating: "fa fa-refresh"
                },
                fields: {
                    beginning_date: {
                        enabled: true,
                        validators: {
                            notEmpty: {
                                message: "The date is required"
                            },
                            date: {
                                format: "DD/MM/YYYY",
                                message: "The date is not valid"
                            }
                        }
                    },
                    replacement_date: {
                        validators: {
                            notEmpty: {
                                message: "The date is required"
                            },
                            date: {
                                format: "DD/MM/YYYY",
                                message: "The date is not valid"
                            }
                        }
                    },

                    position_fill: {
                        validators: {
                            notEmpty: { message: "The position to fill is required" }
                        }
                    },
                    department: {
                        validators: {
                            notEmpty: { message: "The department name is required" }
                        }
                    },
                    location: {
                        validators: {
                            notEmpty: { message: "The Delivery location is required" }
                        }
                    },
                    site_location: {
                        validators: {
                            notEmpty: { message: "The site location is required" }
                        }
                    },
                    office_seating: {
                        validators: {
                            notEmpty: { message: "The office seating location is required" }
                        }
                    },
                    hiring_manager: {
                        validators: {
                            notEmpty: { message: "The hiring manager is required" }
                        }
                    },
                    dotting_line: {
                        validators: {
                            notEmpty: { message: "The dotting line manager is required" }
                        }
                    },
                    interviewer: {
                        validators: {
                            notEmpty: { message: "The interviewer(s) is required" }
                        }
                    },
                    sources: {
                        validators: {
                            notEmpty: { message: "The source(s) for posting is required" }
                        }
                    },
                    description: {
                        validators: {
                            notEmpty: { message: "The job description is required" }
                        }
                    },
                    // length_of_contract: {validators: {notEmpty: {message: "Fill in the length of contract"}}},
                    choose: {
                        validators: { notEmpty: { message: "Choose on of the following" } }
                    },
                    amount_budget: {
                        enabled: true,
                        validators: {
                            notEmpty: { message: "The amount budgeted is required" }
                        }
                    },
                    contigency: {
                        enabled: true,
                        validators: {
                            notEmpty: {
                                message: "The reason for contigency funding is required"
                            }
                        }
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
                    validating: "fa fa-refresh"
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
            if (this.value === "No") {
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
                    "amount_budget",
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
                    "amount_budget",
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
            if (this.value === "New Hire") {
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
            $("#tableItems tr:last").after(
                '<tr><td><div class="form-group">' +
                '<input type="text" name="position_funding" class="form-control position_funding">' +
                '</div></td><td><div class="form-group">' +
                '<input type="number" name="by_source" class="form-control by_source">' +
                "</div></td></tr>"
            );

            let $positionfundingoption = $("tableItems tr:last").find(
                '[name ="position_funding[]"]'
            );
            let $bysourceoption = $("tableItems tr:last").find(
                '[name ="by_source[]"]'
            );

            $("#requisitionform").formValidation("addField", $positionfundingoption);
            $("#requisitionform").formValidation("addField", $bysourceoption);
            i++;
        });

        $("#remove").click(function () {
            if (i > 2) {
                let $positionfundingoption = $("tableItems tr:last").find(
                    '[name ="position_funding[]"]'
                );
                let $bysourceoption = $("tableItems tr:last").find(
                    '[name ="by_source[]"]'
                );

                $("#requisitionform").formValidation(
                    "addField",
                    $positionfundingoption
                );
                $("#requisitionform").formValidation("addField", $bysourceoption);

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
            let hiring_manager = $("#hiring_manager").val();
            let dotting_line = $("#dotting_line").val();
            let interviewer = $("#interviewer").val();
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
});
