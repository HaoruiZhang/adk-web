(function () {
	console.log('Run task plugin loaded.');
	if (typeof Prism === 'undefined' || typeof document === 'undefined') {
		console.warn('Prism or document is not defined. Copy to Clipboard plugin cannot be initialized.');
		return;
	}

	if (!Prism.plugins.toolbar) {
		console.warn('Copy to Clipboard plugin loaded before Toolbar plugin.');

		return;
	}

	/**
	 * When the given elements is clicked by the user, the given text will be copied to clipboard.
	 *
	 * @param {HTMLElement} element
	 * @param {CopyInfo} copyInfo
	 *
	 * @typedef CopyInfo
	 * @property {() => string} getText
	 * @property {() => void} success
	 * @property {(reason: unknown) => void} error
	 */
	function registerRunTask(element, taskInfo) {
		element.addEventListener('click', function (e) {
			runTask(taskInfo);
			e.preventDefault();
			e.stopPropagation();
		});
	}

	// https://stackoverflow.com/a/30810322/7595472

	/** @param {TaskInfo} taskInfo */
	function runTask(taskInfo) {
		console.log('Running task with text:', taskInfo.getText());
		// Simulate a task execution
		try {
			window.parent.postMessage(
				{ key: 'workflowContent', type: 'workflowContent', text: taskInfo.getText() },
				'*'
			);
			taskInfo.success();
		} catch (error) {
			console.error('Task execution failed:', error);
			taskInfo.error(error);
		}
	}

	/**
	 * Selects the text content of the given element.
	 *
	 * @param {Element} element
	 */
	function selectElementText(element) {
		// https://stackoverflow.com/a/20079910/7595472
		window.getSelection().selectAllChildren(element);
	}

	/**
	 * Traverses up the DOM tree to find data attributes that override the default plugin settings.
	 *
	 * @param {Element} startElement An element to start from.
	 * @returns {Settings} The plugin settings.
	 * @typedef {Record<"copy" | "copy-error" | "copy-success" | "copy-timeout", string | number>} Settings
	 */
	function getSettings(startElement) {
		/** @type {Settings} */
		var settings = {
			'run': 'Run',
			'run-error': 'Run task failed',
			'run-success': 'Task submitted',
			'run-timeout': 5000
		};

		var prefix = 'data-prismjs-';
		for (var key in settings) {
			var attr = prefix + key;
			var element = startElement;
			while (element && !element.hasAttribute(attr)) {
				element = element.parentElement;
			}
			if (element) {
				settings[key] = element.getAttribute(attr);
			}
		}
		return settings;
	}
	// window.addEventListener('message', (event) => {
	// 	console.log('prism页面接收到消息, event: ', event);
	// 	if (event.data.key === 'task-state') {
	// 		const { taskId, state } = event.data;
	// 		const inputEle = document.querySelector('.mat-mdc-form-field-infix.ng-tns-c594611921-1').querySelector('textarea');
	// 		inputEle.value = `${inputEle.value} ${path}`;
	// 		inputEle.dispatchEvent(new Event('input', { bubbles: true }));
	// 	};
	// });

	Prism.plugins.toolbar.registerButton('run-task', function (env) {
		console.log('Run task button created for:', env);
		var element = env.element;

		var settings = getSettings(element);

		var linkRun = document.createElement('button');
		linkRun.className = 'run-task-button';
		linkRun.setAttribute('type', 'button');
		var linkSpan = document.createElement('span');
		linkRun.appendChild(linkSpan);

		setState('run');

		registerRunTask(linkRun, {
			getText: function () {
				return element.textContent;
			},
			success: function () {
				setState('run-success');

				resetText();
			},
			error: function () {
				setState('run-error');

				setTimeout(function () {
					selectElementText(element);
				}, 1);

				resetText();
			}
		});

		return linkRun;

		function resetText() {
			setTimeout(function () { setState('run'); }, settings['run-timeout']);
		}

		/** @param {"copy" | "copy-error" | "copy-success"} state */
		function setState(state) {
			linkSpan.textContent = settings[state];
			linkRun.setAttribute('data-run-state', state);
		}
	});
}());
