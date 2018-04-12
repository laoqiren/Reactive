class MVVM {
  constructor(options={}){
    this.$options = options;
    this._data = options.data;

    observe(this._data);
    this.proxy();
    this.compile();
  }
  proxy(){
    let data = this._data;
    for(let key in data){
      Object.defineProperty(this,key,{
        configurable: true,
        get(){
          return data[key];
        },
        set(newVal){
          data[key] = newVal;
        }
      })
    }
  }
  compile(){
    let vm = this;

    vm.$el = document.querySelector(this.$options.el);
    let fragment = document.createDocumentFragment();

    var child;
    while (child = vm.$el.firstChild) {
        fragment.appendChild(child);    // 此时将el中的内容放入内存中
    }
    // 对el里面的内容进行替换
    function replace(frag) {
        Array.from(frag.childNodes).forEach(node => {
            let txt = node.textContent;
            let reg = /\{\{(.*?)\}\}/g;   // 正则匹配{{}}

            if (node.nodeType === 3 && reg.test(txt)) { // 即是文本节点又有大括号的情况{{}}

                  node.textContent = txt.replace(reg,vm.getExpVal(RegExp.$1)).trim();
                  new Watcher(vm,RegExp.$1,newVal=>{
                     // 用trim方法去除一下首尾空格
                    node.textContent = txt.replace(reg, newVal).trim();
                  });
            }

            if (node.nodeType === 1) {  // 元素节点
              let nodeAttr = node.attributes; // 获取dom上的所有属性,是个类数组
              Array.from(nodeAttr).forEach(attr => {
                  let name = attr.name;   // l-model  type
                  let exp = attr.value;   // c        text
                  if (name.includes('l-')){
                      node.value = vm[exp];   // this.c 为 2
                      node.addEventListener('input', e => {
                        let newVal = e.target.value;
                        // 相当于给this.c赋了一个新值
                        // 而值的改变会调用set，set中又会调用notify，notify中调用watcher的update方法实现了更新
                        vm[exp] = newVal;   
                      });
                      // 监听变化
                        new Watcher(vm, exp, function(newVal) {
                          node.value = newVal;   // 当watcher触发时会自动将内容放进输入框中
                      });
                  }
                  
                  
                  
              });
            }
            // 如果还有子节点，继续递归replace
            if (node.childNodes && node.childNodes.length) {
                replace(node);
            }
        });
      }

    replace(fragment);
    vm.$el.appendChild(fragment);
  }
  getExpVal(exp){
    let arr = exp.split('.');
    let val = this;
    arr.forEach(key => {
      val = val[key];
    });
    return val;
  }
  $watch(key,cb){
    new Watcher(this,key,cb);
  }
}

class Dep {
  constructor(){
    this.subs = [];
  }
  addSub(sub){
    this.subs.push(sub);
    return this;
  }
  notify(){
    this.subs.map(sub=>sub.update());
  }
}

class Watcher {
  constructor(vm,exp,cb){
    this.cb = cb;
    this.vm = vm;
    this.exp = exp;
    let arr = exp.split('.');
    let val = vm;
    Dep.target = this;
    arr.forEach(key => {
      val = val[key];
    });
    this.oldValue = val;
    Dep.target = null;
  }
  update(){
    console.log(this.exp,"update了")
    let arr = this.exp.split('.');
    let val = this.vm;
    arr.forEach(key => {
      val = val[key];
    });
    
    if(this.oldValue !== val){
      this.oldValue = val;
      this.cb(val);
    }
  }
}

class Observer {
  constructor(data){
    let dep = this.dep = new Dep();
    const keys = Object.keys(data);
    for(let key of keys){
      let value = data[key];

      observe(value);

      Object.defineProperty(data,key,{
        configurable: true,
        get(){
          if(Dep.target){
            console.log("初始绑定:",key,value);
            dep.addSub(Dep.target);
          }
          return value;
        },
        set(newVal){
          if(newVal === value){
            return;
          }
          value = newVal;
          observe(newVal);
          dep.notify();
        }
      })
    }
  }
}

function observe(data){
  if(!data || typeof data !== 'object'){
    return;
  }
  return new Observer(data);
}


let vm = new MVVM({
  el: '#app',
  data: {
    name: "luoxia",
    info: {
      year: 21,
      addr: "China"
    }
  }
});

setTimeout(() => {
  vm.info.year = 22;
}, 1000);

vm.$watch("name",newName=>{
  console.log("name变化了哦：",newName)
});
//vm.name = "jack"