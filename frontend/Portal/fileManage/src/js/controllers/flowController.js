(function(window, angular, $) {
    'use strict';
	app.controller('FlowCtrl', ['$scope', "$rootScope", "$translate", "$compile", "$http", "$timeout", "$state", "$interval", "$filter", "ControllerConfig", "datecalculation", "jq.datables", '$modal',
		function ($scope, $rootScope, $translate, $compile, $http, $timeout, $state, $interval, $filter, ControllerConfig, datecalculation, jqdatables, $modal) {
            $scope.$on('$viewContentLoaded', function (event) {
                $scope.init();
                $scope.myScroll = null
            });

            $scope.init = function () {
                $scope.name = $translate.instant("WorkItemController.FinishedWorkitem");
                $scope.StartTime = datecalculation.redDays(new Date(), 30);
                $scope.EndTime = datecalculation.addDays(new Date(), 30);
            }
            // 获取语言
            // $rootScope.$on('$translateChangeEnd', function () {
            //     $scope.getLanguage();
            //     $state.go($state.$current.self.name, {}, { reload: true });
            // });

            $scope.getLanguage = function () {
                $scope.LanJson = {
                    search: $translate.instant("uidataTable.search"),
                    ProcessName: $translate.instant("QueryTableColumn.Name"),
                    WorkFlow: $translate.instant("QueryTableColumn.WorkFlow"),
                    StartTime: $translate.instant("QueryTableColumn.StartTime"),
                    FinishTime: $translate.instant("QueryTableColumn.FinishTime"),
                    EndTime: $translate.instant("QueryTableColumn.EndTime"),
                    sLengthMenu: $translate.instant("uidataTable.sLengthMenu"),
                    sZeroRecords: $translate.instant("uidataTable.sZeroRecords"),
                    sInfo: $translate.instant("uidataTable.sInfo"),
                    sProcessing: $translate.instant("uidataTable.sProcessing")
                };
            }
            $scope.getLanguage();
            //初始化流程模板
            $scope.WorkflowOptions = {
                Editable: true,
                Visiable: true,
                Mode: "WorkflowTemplate",
                IsMultiple: true,
                OnChange: "",
                PlaceHolder: $scope.LanJson.WorkFlow,
                IsSearch:true
            }

            $scope.getColumns = function () {
                var columns = [];
                columns.push({
                    "mData": "InstanceName",
                    "mRender": function (data, type, full) {
                        data = $scope.htmlEncode(data);
                        return "<a  target='_blank' href='WorkItemSheets.html?WorkItemID=" + full.ObjectID + "'>" + data + "</a>";
                    }
                });
                columns.push({
                    "mData": "DisplayName",
                    "mRender": function (data, type, full) {
                        //打开流程状态
                        data = data != "" ? data : full.ActivityCode;
                        data = $scope.htmlEncode(data);

                        return "<td><a href='index.html#/InstanceDetail/" + full.InstanceId + "/" + full.ObjectID + "/" + "/' target='_blank'>" + data + "</a></td>";
                    }
                });
                columns.push({ "mData": "ReceiveTime", "sClass": "center hide1024" });
                columns.push({ "mData": "FinishTime", "sClass": "center hide414" });
                columns.push({
                    "mData": "OriginatorName",
                    "sClass": "center hide414",
                    "mRender": function (data, type, full) {
                        data = $scope.htmlEncode(data);
                        return "<a ng-click=\"showUserInfoModal('" + full.Originator + "');\" new-Bindcompiledhtml>" + data + "</a>";
                    }
                });
                columns.push({
                    "mData": "OriginatorOUName",
                    "sClass": "center hide1024",
                    "mRender": function (data, type, full) {
                        data = $scope.htmlEncode(data);
                        return data;
                    }
                });
                return columns;
            }
            $scope.loadScroll = function() {
                $scope.myScroll = new IScroll('.dataTables_scrollBody', {
                    scrollbars: true,
                    bounce: false,
                    mouseWheel: true,
                    interactiveScrollbars: true,
                    shrinkScrollbars: 'scale',
                    fadeScrollbars: true
                });
            };
            $scope.dtOptions_tabfinishWorkitem = {
                "bProcessing": true,
                "bServerSide": true,    // 是否读取服务器分页
                "paging": true,         // 是否启用分页
                "bPaginate": true,      // 分页按钮
                "bFilter": false,        // 是否显示搜索栏
                "searchDelay": 1000,    // 延迟搜索
                "iDisplayLength": 20,   // 每页显示行数
                "bSort": false,         // 排序
                "singleSelect": true,
                "bInfo": true,          // Showing 1 to 10 of 23 entries 总记录数没也显示多少等信息
                "bLengthChange": true, // 每页显示多少数据
                "aLengthMenu": [[10, 20, 50, 100], [10, 20, 50, 100]],//设置每页显示数据条数的下拉选项
                "pagingType": "full_numbers",  // 设置分页样式，这个是默认的值
                "sScrollY": "500px",
                "bScrollCollapse": true,
                "iScrollLoadGap": 50,
                "language": {           // 语言设置
                    "sLengthMenu": $scope.LanJson.sLengthMenu,
                    "sZeroRecords": "<div class='no-data'><p class='no-data-img'></p><p>" + $scope.LanJson.sZeroRecords + "</p></div>", 
                    "sInfo": $scope.LanJson.sInfo,
                    "infoEmpty": "",
                    "sProcessing": '<div class="loading-box"><i class="icon-loading"></i><p>' + $scope.LanJson.sProcessing + '</p></div> ', 
                    "paginate": {
                        "first": "<<",
                        "last": ">>",
                        "previous": "<",
                        "next": ">"
                    }
                },
                "sAjaxSource": ControllerConfig.WorkItem.GetFinishWorkItems,
                "fnServerData": function (sSource, aDataSet, fnCallback) {//WorkItem/GetFinishWorkItems,点击查询
                    $.ajax({
                        "dataType": 'json',
                        "type": 'POST',
                        "url": sSource,
                        "data": aDataSet,
                        "success": function (json) {//返回数据列表
                            //-----标签-start  为了下拉框有数据，所以此处引用了json的数据，也可挪到其他地方使用-----
                            var sltCategoryComBox;//拿到所有数据，然后再重新加载页面数据
                            var pageData = json.Rows//后台接收的列表数据，发送请求的时候吧数据拿过来
                            var initId = "";
                            var initValue = "";
                            if (pageData.length != 0) {
                                initId = pageData[0].InstanceId;//标签的id
                                initValue = pageData[0].DisplayName;//拿到标签的名称
                            }

                            var tmpData = [];
                            pageData.forEach(function (item) {
                                var tmpObj = {};
                                tmpObj.id = item.InstanceId;
                                tmpObj.text = item.DisplayName;
                                tmpData.push(tmpObj);
                            })

                            sltCategoryComBox = $("#proName").ligerComboBox({
                                initValue: initId,//这个请求/Portal/MasterData/GetMasterDataList，要传这个id
                                initText: initValue,
                                data: tmpData,
                                valueFieldID: 'category',
                                url: '/Portal/MasterData/GetMasterDataList',
                                ajaxType: 'GET',
                                valueField: 'id',
                                textField: 'text',
                                autocomplete: true,
                                setTextBySource: true,
                                keySupport: true
                            });
                            //设置想要的样式
                            $("#proName").parent().removeClass();
                            var inputHeight = $("#proName").outerHeight();
                            var inputWidth = $("#proName").outerWidth();
                            $("#proName").css({"border":"1px solid #d9d9d9","border-radius":"4px"});
                            //下拉框的内容样式设置
                            $("div.l-box-select-inner").parent().css({"margin-top": inputHeight + 'px'},{"width": inputWidth + 'px'});
                            $("div.l-box-select").css({"width": inputWidth + 'px'});
                            $("#proName").mouseleave(function (e) {
                                var x = e.pageX - $("#proName").offset().left;
                                var y = e.pageY - $("#proName").offset().top;
                                if(x < 0 || y < 0 || x > inputWidth){
                                    $("div.l-box-select-inner").parent().hide();
                                }
                            });

                            //update by zhangj
                            $("#proName").change(function () {//按回车键触发该函数
                                var id = $("#category").val();//为空，好像都是空的
                            });
                            //-------标签end -------

                            if (json.ExceptionCode == 1 && json.Success == false) {
                                json.Rows = [];
                                json.sEcho = 1;
                                json.Total = 0;
                                json.iTotalDisplayRecords = 0;
                                json.iTotalRecords = 0;
                                $state.go("platform.login");
                            }
                            fnCallback(json);
                            //每次搜索成功后清空搜索关键字
                            $(".input-text").val("");
                        }
                    });
                },
                "sAjaxDataProp": 'Rows',
                "sDom": '<"top"f>rt<"row"ipl>',
                "sPaginationType": "full_numbers",
                "fnServerParams": function (aoData) {
                    // 增加自定义查询条件
                    //ie9不兼容placeholder属性 ie9下当value为空时，其value取placeholder值
                    if ($("#StartTime").attr("placeholder") == $("#StartTime").val()) { 
                        $scope.StartTime = ""; 
                    } else { 
                        $scope.StartTime = $("#StartTime").val();
                    }
                    if ($("#EndTime").attr("placeholder") == $("#EndTime").val()) { 
                        $scope.EndTime = ""; 
                    } else { 
                        $scope.EndTime = $("#EndTime").val();
                    }
                    //将时间转化为时间戳
                    var startTimes = new Date($scope.StartTime.replace(/-/g, "/")).getTime(); 
                    var EndTimes = new Date($scope.EndTime.replace(/-/g, "/")).getTime(); 
                    if (startTimes > EndTimes) { 
                        $.notify({message: "时间区间错误", status: "danger"}); 
                        $("#EndTime").css("color", "red"); 
                        return false;
                    }
                    aoData.push(
                        {"name": "startTime", "value": $filter("date")($scope.StartTime, "yyyy-MM-dd")}, 
                        {"name": "endTime", "value": $filter("date")($scope.EndTime, "yyyy-MM-dd")}, 
                        {"name": "workflowCodes", "value": $scope.WorkflowCodes},
                        {"name": "instanceName", "value": $scope.InstanceName }
                    );
                },
                "aoColumns": $scope.getColumns(), // 字段定义
                // 初始化完成事件,这里需要用到 JQuery ，因为当前表格是 JQuery 的插件
                // "initComplete": function (settings, json) {
                //     var filter = $(".searchContainer");
                //     filter.find("button").unbind("click.DT").bind("click.DT", function () {
                //         $scope.WorkflowCodes = $("#sheetWorkflow").SheetUIManager().GetValue();
                //         $("#tabfinishWorkitem").dataTable().fnDraw();
                //     });
                //     $scope.loadScroll();
                // },
                //创建行，未绘画到屏幕上时调用
                // "fnRowCallback": function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                //     //将添加的angular事件添加到作用域中
                //     $compile(nRow)($scope);
                //     setTimeout(function(){
                //         $scope.myScroll.refresh();
                //     },300);
                // },
                // "fnDrawCallback": function () {
                //     jqdatables.trcss();
                // }
						}
						
					/*************共享知识新建知识模态框*****************/
					$scope.newFlow = function (data) {
						// 清空原始输入数据
						$rootScope.temp.tempModel.name = "";
						$rootScope.temp.tempModel.des = "";
						var AgencyID;
						if (data == undefined) AgencyID = "";
						else AgencyID = data;
						$http({
							url: ControllerConfig.Agents.GetAgency,
							params: {
								agentID: AgencyID,
								random: new Date().getTime()
							}
						}).success(function (result, header, config, status) {
								var Agency = result.Rows[0];

								// 弹出模态框
								var modalInstance = $modal.open({
									templateUrl: 'newFlow.html',    // 指向上面创建的视图
									controller: 'ModalsController',// 初始化模态范围
									size: "md",
									resolve: {
										params: function () {
											return {
												user: $scope.user,
												Agency: Agency,
												AgencyID: AgencyID
											};
										},
										deps: ['$ocLazyLoad', function ($ocLazyLoad) {
											return $ocLazyLoad.load([
												'WFRes/_Content/themes/ligerUI/Aqua/css/ligerui-all.min.css',
												'WFRes/assets/stylesheets/sheet.css',
												'WFRes/_Scripts/jquery/jquery.lang.js',
												'WFRes/_Scripts/ligerUI/ligerui.all.min.js',
												'WFRes/_Scripts/MvcSheet/SheetControls.js',
												'WFRes/_Scripts/MvcSheet/MvcSheetUI.js'
											]).then(function () {
												return $ocLazyLoad.load([
													'WFRes/_Scripts/MvcSheet/Controls/SheetWorkflow.js',
													'WFRes/_Scripts/MvcSheet/Controls/SheetUser.js'
												]);
											});
										}]
									}
								});
						}) 
						
						var times = setInterval(function () {
							if ($("#WorkflowCodes").length > 0) {//id没有改过来，因为没有用到
								clearInterval(times);
								$(".select2-search-field").find("input").css("z-index", 0);
								//console.log($("#WorkflowCodes"));
								$("#WorkflowCodes").css("width", "246px");
							}
						}, 50);
					}

        }]);

})(window, angular, jQuery);