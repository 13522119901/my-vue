// var Penson = {
//   name: 'chenyh1'
// }
// console.log(Penson.name)


// var Penson = {
// }
// console.log(Penson)
// Object.defineProperty(Penson, 'name', {
//   set: function(val) {
//     name = val;
//     console.log('设置name为：', val);
//   },
//   get: function() {
//     return `name为：${name}`;
//   }
// });
// Penson.name = 'chenyh1'
// console.log(Penson.name)
// console.log(Penson)




// var house = {
//   person1: null,
//   person2: {
//     name: 'chenyh1'
//   },
//   person3: {
//     age: 11,
//     aa:{
//       bb: 'bb'
//     }
//   }
// }

// observe(house)

// function observe(data) {
//   if(!data || typeof data !== 'object') {
//     return;
//   }
//   Object.keys(data).forEach(key => {
//     defineReactive(data, key, data[key]);
//   })
// }

// function defineReactive(data, key, val) {
//   observe(val);
//   Object.defineProperty(data, key, {
//     get: function() {
//         return val;
//     },
//     set: function(newVal) {
//         val = newVal;
//         console.log(`${key}:${val}`);
//     }
//   });
// }
// house.person1 = 'none';
// house.person2.name = 'chenyh1'
// house.person3.name = 'chenyh1' //没有被劫持，不会被监听
// house.person3.age = '22'
// house.person3.aa.bb = 'cc'
// house.person3.aa = 'aa'



var house = {
  person1: null,
  person2: {
    name: 'chenyh1'
  },
  person3: {
    age: 11,
    aa:{
      bb: 'bb'
    }
  }
}

observe(house)
// --------------observe------------------
function observe(data) {
  if(!data || typeof data !== 'object') {
    return;
  }
  Object.keys(data).forEach(key => {
    defineReactive(data, key, data[key]);
  })
}

function defineReactive(data, key, val) {
  observe(val);
  var dep = new Dep();
  Object.defineProperty(data, key, {
    get: function() {
      if(Dep.target) {
        dep.addSub(Dep.target)
        console.log(`劫持监听器get：有人订阅${key}`)
      }
      return val;
    },
    set: function(newVal) {
      if(val === newVal) return;
      val = newVal;
      console.log(`劫持监听器set：${key}:${val}`);
      dep.notify();
    }
  });
}
// house.person1 = 'none';
// house.person2.name = 'chenyh1'
// house.person3.name = 'chenyh1' //没有被劫持，不会被监听
// house.person3.age = '22'
// house.person3.aa.bb = 'cc'
// house.person3.aa = 'aa'



// --------------Dep------------------
// 订阅器
function Dep() {
  this.subs = [];
  // 添加订阅者
  this.addSub = function (sub) {
    this.subs.push(sub)
  }
  // 通知订阅者
  this.notify = function () {
    this.subs.forEach(sub=>{
      sub.update();
    })
  }
}
Dep.target = null;



// --------------Watcher------------------
function Watcher(vm, exp, callback) {
  this.callback = callback;
  this.vm = vm;
  this.exp = exp;
  this.value = this.get();
}
Watcher.prototype = {
  update: function(){
    var value = this.vm.data[this.exp];
    var old = this.value;
    if(value !== old) {
      this.value = value; // 更新订阅者的当前数据
      this.callback.call(this.vm,this.value, old)
    }
  },
  get: function() {
    Dep.target = this; //标记为未订阅
    var value = this.vm[this.exp];  // 拉取数据，触发属性的get方法获取数据同时达到订阅目的
    Dep.target = null; // 取消标记
    return value;
  }
}


// --------------Vue------------------
function Vue(options) {
  this.data = options.data;
  this.methods = options.methods;
  // data数据代理到vue全局
  Object.keys(this.data).forEach(key => {
    this.proxyKeys(key);
  })
  // 劫持监听data内属性
  observe(this.data);
  // // 初始化渲染视图
  // el.innerHTML = this.data[exp];
  // // 初始化订阅者
  // new Watcher(this, exp, function(val) {
  //   // 数据变更后回调变更视图数据
  //   console.log('视图更新')
  //   el.innerHTML = val;
  // })
  new Compile(options.el, this);
  return this;
}
Vue.prototype = {
  proxyKeys: function(key) {
    var self = this;
    Object.defineProperty(this,key,{
      enumerable: false,
      configurable: true,
      get: function proxyGetter() {
        console.log('代理get')
          return self.data[key];
      },
      set: function proxySetter(newVal) {
        console.log('代理set');
          self.data[key] = newVal;
      }
    })
  }
}

// --------------Compile------------------

function Compile(el, vm) {
  this.vm = vm;
  this.el = document.querySelector(el);
  this.fragment = null;
  this.init();
}
Compile.prototype = {
  init: function() {
    if(this.el) {
      this.fragment = this.nodeToFragment(this.el);
      this.compileElement(this.fragment);
      // 渲染到页面
      this.el.appendChild(this.fragment);
    } else {
        console.log('Dom元素不存在');
    }
  },
  // 模板转化为Fragment集合
  nodeToFragment: function (el) {
    var fragment = document.createDocumentFragment();
    var child = el.firstChild;
    while (child) {
        // 将Dom元素移入fragment中
        fragment.appendChild(child);
        child = el.firstChild
    }
    return fragment;
  },
  compileElement: function compileElement(el) {
    var childNodes = el.childNodes;
    var self = this;
    childNodes.forEach(node => {
      var reg = /\{\{(.*)\}\}/;
      var text = node.textContent;
      if (self.isElementNode(node)) {  
        self.compile(node);
    } if (self.isTextNode(node) && reg.test(text)) {  // 判断是否是符合这种形式{{}}的指令
        self.compileText(node, reg.exec(text)[1]);
      }
      if (node.childNodes && node.childNodes.length) {
        self.compileElement(node);
      }
    })
  }, 
  compile: function(node) {
    var nodeAttrs = node.attributes;
    var self = this;
    Array.prototype.forEach.call(nodeAttrs, function(attr) {
        var attrName = attr.name;
        if (self.isDirective(attrName)) {
          var exp = attr.value;
          var dir = attrName.substring(2);
          if (self.isEventDirective(dir)) {  // 事件指令
              self.compileEvent(node, self.vm, exp, dir);
          } else {  // v-model 指令
              self.compileModel(node, self.vm, exp, dir);
          }
          node.removeAttribute(attrName);
        }
    });
  },
  compileEvent: function(node, vm, exp, dir) {
    var eventType = dir.split(':')[1];
    var cb = vm.methods && vm.methods[exp];

    if (eventType && cb) {
        node.addEventListener(eventType, cb.bind(vm), false);
    }
  },
  compileModel: function(node, vm, exp, dir) {
    var self = this;
    var val = this.vm[exp];
    this.modelUpdater(node, val);
    new Watcher(this.vm, exp, function (value) {
        self.modelUpdater(node, value);
    });
    node.addEventListener('input', function(e) {
        var newValue = e.target.value;
        if (val === newValue) {
            return;
        }
        self.vm[exp] = newValue;
        val = newValue;
    });
  },
  compileText: function(node, exp) {
    var self = this;
    var initText = this.vm[exp];
    this.updateText(node, initText);
    new Watcher(this.vm, exp, function (value) { // 生成订阅器并绑定更新函数
      self.updateText(node, value);
    });
  },
  updateText: function (node, value) {
    node.textContent = typeof value == 'undefined' ? '' : value;
  },
  modelUpdater: function(node, value, oldValue) {
    node.value = typeof value == 'undefined' ? '' : value;
  },
  isTextNode: function(node) {
      return node.nodeType == 3;
  },
  isElementNode: function (node) {
    return node.nodeType == 1;
  },
  isDirective: function(attr) {
    return attr.indexOf('v-') == 0;
  },
  isEventDirective: function(dir) {
      return dir.indexOf('on:') === 0;
  },
}
// new Compile('#app')




var vue = new Vue({
    el: '#app',
    data: {name: 'chenyh1', age:11},
    methods: {
      click() {
        this.age = 100
      }
    }
  });
console.log(vue.name)


setTimeout(function(){
  vue.name = 'zhangsan'
},3000)