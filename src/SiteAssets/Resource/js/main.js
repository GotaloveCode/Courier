$('#calendar').fullCalendar({
    themeSystem: 'bootstrap4',
    header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
    },
    navLinks: true, // can click day/week names to navigate views
    selectable: true
});
$(document).ready(function () {
    initForm();
    $('#reportstable').dataTable();
    $('#admintable').dataTable();
    $('#datepicker').datetimepicker({
        format: 'YYYY-MM-DD'
    });
    $("select[name='unitofmeasure[]']").select2({
        tags: true
    });

    $('#starttimepicker,#endtimepicker').datetimepicker({format: 'LT'});
    $('#btnadd').on('click', function () {
        $('#tableItems tr:last').after('<tr><td><input type="text" class="form-control" name="item[]" id="item"></td><td>\n' +
            '                                                                    <div class="form-group">\n' +
            '                                                                        <select name="unitofmeasure[]" id="unitOfmeasure" class="form-control input-sm unitOfmeasure">\n' +
            '                                                                            <option></option>\n' +
            '                                                                            <option>Pieces</option>\n' +
            '                                                                            <option>Kgs</option>\n' +
            '                                                                            <option>Litres</option>\n' +
            '                                                                            <option>Pax</option>\n' +
            '                                                                            <option>Reams</option>\n' +
            '                                                                            <option>Packs</option>\n' +
            '                                                                            <option>Tins</option>\n' +
            '                                                                            <option>Packets</option>\n' +
            '                                                                        </select>\n' +
            '                                                                    </div></td><td><input type="number" name="number[]" id="number" class="form-control quantity"></td><td><input type="number" name="unit-cost[]" id="unit-cost" class="form-control unitcost"></td><td><input type="text" name="totalamount[]" id="totalamount" class="form-control subtotal" readonly></td></tr>');
        $itemoption = $('#tableItems tr:last').find('[name="item[]"]');
        $unitoption = $('#tableItems tr:last').find('[name="unitofmeasure[]"]');
        $numberoption = $('#tableItems tr:last').find('[name="number[]"]');
        $unitCostoption = $('#tableItems tr:last').find('[name="unit-cost[]"]');
        $totaloption = $('#tableItems tr:last').find('[name="totalamount[]"]');

        $('#requesterDetails').formValidation('addField', $itemoption);
        $('#requesterDetails').formValidation('addField', $unitoption);
        $('#requesterDetails').formValidation('addField', $numberoption);
        $('#requesterDetails').formValidation('addField', $unitCostoption);
        $('#requesterDetails').formValidation('addField', $totaloption);
        i++;

        $("select[name='unitofmeasure[]']").select2({
            tags: true
        });
    });
    $('#btnremove').on('click', function () {
        if (i > 2) {
            $itemoption = $('#tableItems tr:last').find('[name="item[]"]');
            $unitoption = $('#tableItems tr:last').find('[name="unitofmeasure[]"]');
            $numberoption = $('#tableItems tr:last').find('[name="number[]"]');
            $unitCostoption = $('#tableItems tr:last').find('[name="unit-cost[]"]');
            $totaloption = $('#tableItems tr:last').find('[name="totalamount[]"]');

            $('#requesterDetails').formValidation('removeField', $itemoption);
            $('#requesterDetails').formValidation('removeField', $unitoption);
            $('#requesterDetails').formValidation('removeField', $numberoption);
            $('#requesterDetails').formValidation('removeField', $unitCostoption);
            $('#requesterDetails').formValidation('removeField', $totaloption);

            $('#tableItems tr:last').remove();
            i--;
            var total_pre = 0;
            $('.subtotal').each(function (index, val) {
                total_pre += parseInt($(val).val().replace(/,/g, ""));
            });

            $('#totalcost').text(total_pre.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"));
        }
    });

    $(".content").on('keyup', ".unitcost", function () {
        let cost = $(this).val();
        let quantity = $(this).closest('td').prev().find('.quantity').val();
        if (cost && quantity) {
            $(this).closest('td').next().find('.subtotal').val((cost * quantity).toFixed(2));
            var total_pre = 0;
            $('.subtotal').each(function (index, val) {
                total_pre += parseInt($(val).val().replace(/,/g, ""));
            });

            $('#totalcost').text(total_pre.toFixed(2));
        }
    });

    $(".content").on('keyup', ".quantity", function () {
        let quantity = $(this).val();
        let cost = $(this).closest('td').next().find('.unitcost').val();
        if (cost && quantity) {
            $(this).closest('td').next().next().find('.subtotal').val((cost * quantity).toFixed(2));
            var total_pre = 0;
            $('.subtotal').each(function (index, val) {
                total_pre += parseInt($(val).val().replace(/,/g, ""));
            });
            $('#totalcost').text(total_pre.toFixed(2));
        }
    });
});

var i = $('#tableItems tr').size();

function adjustIframeHeight() {
    var $body = $('body'),
        $iframe = $body.data('iframe.fv');
    if ($iframe) {
        // Adjust the height of iframe
        $iframe.height($body.height());
    }
}

function initForm() {
    $('#requesterDetails').steps({
        headerTag: "h3",
        bodyTag: "fieldset",
        transitionEffect: "slideLeft",
        onStepChanging: function (e, currentIndex, newIndex) {
            adjustIframeHeight();
            if (currentIndex > newIndex) {
                return true;
            }
            var fv = $('#requesterDetails').data('formValidation'),
                $container = $('#requesterDetails').find('fieldset[data-step="' + currentIndex + '"]');
            fv.validateContainer($container);

            var isValidStep = fv.isValidContainer($container);
            if (isValidStep === false || isValidStep === null) {
                return false;
            }

            if (currentIndex == 0 && newIndex == 1) {
                $('#roombind').html($('#room').val());
                $('#dateofmeeting').html($('#date').val());
                $('#nameofmeeting').html($('#meetingName').val());
                $('#starttime').html($('#start').val());
                $('#endtime').html($('#end').val());
                $('#reqname').html($('#requesterName').val());
                $('#durationMeeting').html($('#meetingDuration').val() + '' + '' + $('#meetingDurationUnit').val());
            } else if (currentIndex == 1 && newIndex == 2) {
                var items = $('input[name="equipment"]:checked');
                var list = '';
                $.each(items, function (k, v) {
                    list += '<li>' + v.value + '</li>';
                });
                $('#natureneeded').html($('#nature').val());
                $('#materialsneeded').html('<ul>' + list + '</ul>');
            } else if (currentIndex == 2 && newIndex == 3) {
                let content = '';
                $('#tableItems tbody tr').each(function (index, value) {
                    content += '<tr>';
                    content += '<td>' + $(this).find('#item').val() + '</td>';
                    content += '<td>' + $(this).find('.unitOfmeasure').val() + '</td>';
                    content += '<td>' + $(this).find('#number').val() + '</td>';
                    content += '<td>' + $(this).find('#unit-cost').val() + '</td>';
                    content += '<td>' + $(this).find('#totalamount').val() + '</td>';
                    content += '</tr>';
                });
                content += '<tr>';
                content += '<td colspan="4">Overall Total Amount</td>';
                content += '<td>' + $('#totalcost').text() + '</td>';
                content += '</tr>';

                $('#itemslist').html(content);
            }
            return true;
        },
        onFinishing: function (e, currentIndex) {
            var fv = $('#requesterDetails').data('formValidation'),
                $container = $('#requesterDetails').find('fieldset[data-step="' + currentIndex + '"]');

            // Validate the last step container
            fv.validateContainer($container);

            var isValidStep = fv.isValidContainer($container);
            if (isValidStep === false || isValidStep === null) {
                return false;
            }

            return true;
        },
        onFinished: function (e, currentIndex) {
        }
    }).formValidation({
        framework: 'bootstrap',
        icon: {
            valid: 'fa fa-check',
            invalid: 'fa fa-times',
            validating: 'fa fa-refresh'
        },
        excluded: 'disabled',
        fields: {
            room: {
                validators: {
                    notEmpty: {
                        message: "Room is required"
                    }
                }
            },
            date: {
                validators: {
                    notEmpty: {
                        message: 'Date of meeting is required'
                    }
                }
            },
            requesterName: {
                validators: {
                    notEmpty: {
                        message: 'Name of the Requester is required'
                    }
                }
            },
            meetingName: {
                validators: {
                    notEmpty: {
                        message: 'Name of meeting must be included'
                    }
                }
            },
            meetingDuration: {
                validators: {
                    notEmpty: {
                        message: 'Duration of meeting is required'
                    },
                    greaterThan: {
                        value: 0,
                        message: 'The value must be grater than 0'
                    }
                }
            },
            start: {
                validators: {
                    notEmpty: {
                        message: 'Start time is required'
                    }
                }
            },
            end: {
                validators: {
                    notEmpty: {
                        message: 'End time is required'
                    }
                }
            },
            nature: {
                required: false
            },
            equipment: {
                required: false
            }
        }
    });
    ;
}