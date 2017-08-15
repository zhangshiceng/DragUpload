/**
 * 拖拽上传
 * @author  shicheng.zhang
 * @mail    1058766319@qq.com
 * @date    2017-08-15
 * @version v1.0.0
 * 没有做浏览器兼容，简单实现拖拽上传
 */
var DragUpload = {
    task: [], // 处理要上传的任务
    tasksFailed: [], // 失败的任务
    fileID: 0, // fileID
    options: {
        DOMElement: document, // 设置触发事件的元素, 默认是 document
        url: "", // 接收文件的地址, 例： http://localhost/test.php
        fileType: 'all', // all: 支持上传所有类型的文件，image: 仅支持上传图片类型的文件，video: 仅支持上传视频类型的文件，audio: 仅支持上传音频文件。默认为 all
        maxSize: 128, // 文件大小限制。单位是 M, 默认最大不能超过 128 M
        maxQueue: 9, // 单次最多上传文件的数量限制

        // 将文件拖入指定的元素内触发的回调
        onDragenter: function(e) {
            console.log(e);
        },

        // 将文件拖出指定的元素后触发的回调
        onDragleave: function(e) {
            console.log(e);
        },

        // 将文件在指定的元素内拖动触发的回调
        onDragover: function(e) {
            console.log(e);
        },

        // 将文件拖入并放置在指定元素内以后触发的回调
        onDrop: function(e) {
            console.log(e);
        },

        // 开始上传的回调
        onUploadStart: function(fileId) {
            console.log('File ' + fileId + ' starts to uploading ');
        },

        // 上传中的回调
        onUploadProgress: function(fileId, uploadLen, totalLen) {
             console.log('File ' + fileId + ' uploading progress changed: ' + uploadLen + '/' + totalLen);
        },

        // 上传成功的回调
        onUploadSuccess: function(fileId, resonseObject) {
            console.log('File ' + fileId + ' upload success');
        },

        // 上传失败的回调
        onUploadFailed: function(fileId, code, msg) {
            console.log('File ' + fileId + ' upload failed ' + code + ' => ' + msg);
        }
    },

    /**
     * 初始化上传对象
     * @param  {object} options 选项，可以允许的选项请参见 defaultOptions
     * @return {void}         [description]
     */
    init: function(options) {
        this.options = this.buildOptions(options, this.options);
        this.BindEvent(); // 绑定事件
    },

    /**
     * 绑定事件
     * @return {void}               [description]
     */
    BindEvent: function() {
        var dom = this.options.DOMElement;
        var self = this;

        // 拖进
        dom.addEventListener('dragenter', function(e) {
            e.preventDefault(); // 阻止默认事件

            // 触发回调
            if (typeof DragUpload.options.onDragenter === 'function')
                DragUpload.options.onDragenter.call(DragUpload, e);
        }, false);

        // 拖出
        dom.addEventListener('dragleave', function(e) {
            e.preventDefault(); // 阻止默认事件

            // 触发回调
            if (typeof DragUpload.options.onDragleave === 'function')
                DragUpload.options.onDragleave.call(DragUpload, e);
        }, false);

        // 拖来拖去
        dom.addEventListener('dragover', function(e) {
            e.preventDefault(); // 阻止默认事件

            // 触发回调
            if (typeof DragUpload.options.onDragover === 'function')
                DragUpload.options.onDragover.call(DragUpload, e);
        }, false);

        // 拖放后
        dom.addEventListener('drop', function(e) {
            e.preventDefault(); // 阻止默认事件

            if (!self.checkFiles(e.dataTransfer.files)) return false; // 检测选中的文件是否符合条件

            self.addFile(e.dataTransfer.files); // 添加任务

            // 触发回调
            if (typeof DragUpload.options.onDrop === 'function')
                DragUpload.options.onDrop.call(DragUpload, e);
        }, false)
    },

    /**
     * 添加任务
     * @param  {object} files 要上传的文件
     * @return {void}         [description]
     */
    addFile: function(files) {
        if (this.task.length >= 9) {
            alert('单次最多只能上传 ' + this.options.maxQueue + ' 个文件！');
            return false;
        }
        for (var i = 0; i < files.length; i++) {
            if (typeof files[i] === 'object') {
                var blobUrl = '';
                if (files[i].type.indexOf('image') !== -1)
                    blobUrl = window.URL.createObjectURL(files[i]);

                var tmp_arr = {
                    fileId: this.fileID,
                    file: files[i],
                    blobUrl: blobUrl,
                    name: files[i].name,
                    size: files[i].size
                };
                this.task.push(tmp_arr);

                this.fileID ++;
            }
        }
    },

    /**
     * 移除任务
     * @param  {int} fileId 任务 ID
     * @return {bool}
     */
    removeFile: function(fileId) {
        if (!fileId) return false;

        for(k in this.task) {
            if (fileId == this.task[k].fileId) {
                this.task.splice(k, 1);
                break;
            }
        }
        return true;
    },

    /**
     * 将失败的任务加入到失败的队列中
     * @param  {object}
     */
    addEnqueueFailedTask: function(failedTask) {
        this.tasksFailed.push(failedTask);
    },

    /**
     * 开始处理上传队列
     * @return {[type]}               [description]
     */
    processQueue: function() {
        // 表明队列里面没有要上传的任务了
        if (this.task.length === 0) {
            // 那么需要检查一下失败的队列中是否有内容，有的话，就把失败任务重新回队列，但是依然表示此次队列处理完毕了。
            if (this.tasksFailed.length > 0) {
                this.task = [].concat(this.tasksFailed);
                this.tasksFailed = [];
            }
            return;
        }
        var task = this.task.shift();
        this.upload(task);
    },

    /**
     * 上传文件。
     * @param  {[type]} task [description]
     * @return {[type]}      [description]
     */
    upload: function(task) {
        if (typeof this.options.onUploadStart === 'function') {
            this.options.onUploadStart.call(this, task.fileId);
        }

        var uploadRequest = new XMLHttpRequest();
        uploadRequest.onreadystatechange = function() {
            if(uploadRequest.readyState === XMLHttpRequest.DONE) {
                if (uploadRequest.status === 200) {
                    // console.log(uploadRequest.responseText);
                    if (typeof DragUpload.options.onUploadSuccess === 'function') {
                        DragUpload.options.onUploadSuccess.call(DragUpload, task.fileId, JSON.parse(uploadRequest.responseText));
                    }
                } else {
                    // console.log(uploadRequest.responseText);
                    if (typeof DragUpload.options.onUploadFailed === 'function') {
                        DragUpload.options.onUploadFailed.call(DragUpload, task.fileId, "");
                    }
                }
                DragUpload.processQueue();
            }
            else
                return;
        };

        uploadRequest.upload.onprogress = function(evt) {
            if (typeof DragUpload.options.onUploadProgress === 'function') {
                DragUpload.options.onUploadProgress.call(DragUpload, task.fileId, evt.loaded, evt.total);
            }
        };

        uploadRequest.ontimeout = function() {
            DragUpload.addEnqueueFailedTask(task);
            if (typeof DragUpload.options.onUploadFailed === 'function') {
                DragUpload.options.onUploadFailed.call(DragUpload, task.fileId, -2, '上传超时');
            }
        };

        uploadRequest.onerror = function() {
            DragUpload.addEnqueueFailedTask(task);
            if (typeof DragUpload.options.onUploadFailed === 'function') {
                DragUpload.options.onUploadFailed.call(DragUpload, task.fileId, -1, '上传失败');
            }
        };

        uploadRequest.open('POST', this.options.url, true);
        uploadRequest.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        // uploadRequest.timeout = 10000;
        var formdata =  new FormData();
        formdata.append(task.fileId, task.file);
        uploadRequest.send(formdata);
    },

    /**
     * 检测选中文件是否符合条件
     * @param   {object} files  选中的文件
     * @return  {bool}
     */
    checkFiles: function(files) {
        // 检测选中的文件是否大于限制的文件数
        if (files.length > this.options.maxQueue)
        {
            alert('单次最多只能上传 ' + this.options.maxQueue + ' 个文件！');
            return false;
        }

        // 检测选中文件是否符合设置的文件类型和大小
        for (var i = 0; i < files.length; i++) {
            if (this.options.fileType !== 'all') {
                if (files[i].type.indexOf(this.options.fileType) === -1) {
                    alert('仅支持上传 ' + this.options.fileType + ' 类型的文件');
                    return false;
                }
            }

            if (files[i].size > this.options.maxSize  * 1024 * 1024) {
                alert('仅支持 ' + this.options.maxSize + 'M 以内的文件，' + files[i].name + ' 超出限制的大小，请重新选择！');
                return false;
            }
        }

        return true;
    },

    /**
     * 工具函数，拼接用户选项和默认选项。
     * @param  {object} customOptions  用户传入的选项
     * @param  {object} defaultOptions 默认选项
     * @return {object}                拼接后的选项
     */
    buildOptions: function(customOptions, defaultOptions) {
        if ( ! customOptions) return defaultOptions;

        var options = defaultOptions;
        if ( ! options) options = {};

        for (k in customOptions) {
            options[k] = customOptions[k] || defaultOptions[k];
        }
        return options;
    }
}
