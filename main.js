
$(document).ready(function () {
    validateCourier();
    $('#sentTable,#receivedTable,#adminTable,#reportsTable').dataTable();
    // load the datepickers
    $('#datepicker,#rdatepicker,#office2datepicker').datetimepicker({
        format: 'DD-MM-YYYY'
    });
});

// validate the forms
function validateCourier(){
    $('#sendertab').formValidation({
        framework: 'bootstrap',
        icon: {
            valid: 'fa fa-check',
            invalid: 'fa fa-times',
            validating: 'fa fa-refresh'
        },
        fields: {
            package: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The package is required'
                    }
                }
            },
            sender: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The sender is required'
                    }
                }
            },
            description: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The description is required'
                    }
                }
            },
            destination: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The destination is required'
                    }
                }
            },
            recipient: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The recipient is required'
                    }
                }
            },
            origin: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The origin is required'
                    }
                }
            },
            project: {
                row:'.col-xs-4',
                validators: {
                    notEmpty: {
                        message: "The Project is required"
                    }
                }
            }
        }
    });
    $('#officeadmin').formValidation({
        framework: 'bootstrap',
        icon: {
            valid: 'fa fa-check',
            invalid: 'fa fa-times',
            validating: 'fa fa-refresh'
        },
        fields: {
            office_package: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The package is required'
                    }
                }
            },
            office_sender: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The sender is required'
                    }
                }
            },
            office_description: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The description is required'
                    }
                }
            },
            office_transittype: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The Transit Type is required'
                    }
                }
            },
            rwaybillno: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The Waybill Number is required'
                    }
                }
            },
            office_destination: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The destination is required'
                    }
                }
            },
            office_recipient: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The recipient is required'
                    }
                }
            },
            office_location: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The location is required'
                    }
                }
            },
            office_project: {
                row:'.col-xs-4',
                validators: {
                    notEmpty: {
                        message: "The Project is required"
                    }
                }
            },
            rproducttype: {
                row:'.col-xs-4',
                validators: {
                    notEmpty: {
                        message: "The Product Type is required"
                    }
                }
            },
            office_weight: {
                row:'.col-xs-4',
                validators: {
                    notEmpty: {
                        message: "The Weight is required"
                    }
                }
            },
            office_date: {
                row:'.col-xs-4',
                validators: {
                    notEmpty: {
                        message: "The Date is required"
                    }
                }
            }
        }
    });
    $('#officeadmin2').formValidation({
        framework: 'bootstrap',
        icon: {
            valid: 'fa fa-check',
            invalid: 'fa fa-times',
            validating: 'fa fa-refresh'
        },
        fields: {
            office2_package: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The package is required'
                    }
                }
            },
            office2_sender: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The sender is required'
                    }
                }
            },
            office2_description: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The description is required'
                    }
                }
            },
            office2_transittype: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The Transit Type is required'
                    }
                }
            },
            office2_waybillno: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The Waybill Number is required'
                    }
                }
            },
            office2_destination: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The destination is required'
                    }
                }
            },
            office2_recipient: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The recipient is required'
                    }
                }
            },
            office2_location: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The location is required'
                    }
                }
            },
            office2_project: {
                row:'.col-xs-4',
                validators: {
                    notEmpty: {
                        message: "The Project is required"
                    }
                }
            },
            office2_producttype: {
                row:'.col-xs-4',
                validators: {
                    notEmpty: {
                        message: "The Product Type is required"
                    }
                }
            },
            office2_weight: {
                row:'.col-xs-4',
                validators: {
                    notEmpty: {
                        message: "The Weight is required"
                    }
                }
            },
            office2_date: {
                row:'.col-xs-4',
                validators: {
                    notEmpty: {
                        message: "The Date is required"
                    }
                }
            }
        }
    });
    $('#receivertab').formValidation({
        framework: 'bootstrap',
        icon: {
            valid: 'fa fa-check',
            invalid: 'fa fa-times',
            validating: 'fa fa-refresh'
        },
        fields: {
            rpackage: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The package is required'
                    }
                }
            },
            rsender: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The sender is required'
                    }
                }
            },
            rdescription: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The description is required'
                    }
                }
            },
            rtransittype: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The Transit Type is required'
                    }
                }
            },
            r_waybillno: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The Waybill Number is required'
                    }
                }
            },
            rdestination: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The destination is required'
                    }
                }
            },
            rrecipient: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The recipient is required'
                    }
                }
            },
            rlocation: {
                row: '.col-xs-4',
                validators: {
                    notEmpty: {
                        message: 'The location is required'
                    }
                }
            },
            rproject: {
                row:'.col-xs-4',
                validators: {
                    notEmpty: {
                        message: "The Project is required"
                    }
                }
            },
            rproducttype: {
                row:'.col-xs-4',
                validators: {
                    notEmpty: {
                        message: "The Product Type is required"
                    }
                }
            },
            rweight: {
                row:'.col-xs-4',
                validators: {
                    notEmpty: {
                        message: "The Weight is required"
                    }
                }
            },
            rdate: {
                row:'.col-xs-4',
                validators: {
                    notEmpty: {
                        message: "The Date is required"
                    }
                }
            }
        }
    });
}