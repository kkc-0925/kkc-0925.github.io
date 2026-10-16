'use strict';
const bundledDemoImages={"photo-1501386761578-eac5c94b800a":"media/demo/demo-01.jpg","photo-1470229722913-7c0e2dbbafd3":"media/demo/demo-02.jpg","photo-1459749411175-04bf5292ceea":"media/demo/demo-03.jpg","photo-1506157786151-b8491531f063":"media/demo/demo-04.jpg","photo-1492684223066-81342ee5ff30":"media/demo/demo-05.jpg","photo-1516280440614-37939bbacd81":"media/demo/demo-06.jpg"};
const websiteMediaTypes={"media/photos/photo-01.jpg":"image/jpeg","media/photos/photo-02.jpg":"image/jpeg","media/photos/photo-03.jpg":"image/jpeg","media/photos/photo-04.jpg":"image/jpeg","media/photos/photo-05.jpg":"image/jpeg","media/photos/photo-06.jpg":"image/jpeg","media/photos/photo-07.jpg":"image/jpeg","media/photos/photo-08.jpg":"image/jpeg","media/photos/photo-09.jpg":"image/jpeg","media/photos/photo-10.jpg":"image/jpeg","media/photos/photo-11.jpg":"image/jpeg","media/photos/photo-12.jpg":"image/jpeg","media/background/background.jpg":"image/jpeg","media/music/song-01.mp3":"audio/mpeg","media/music/song-02.mp3":"audio/mpeg","media/music/song-03.mp3":"audio/mpeg","media/music/song-04.mp3":"audio/mpeg","media/music/song-05.mp3":"audio/mpeg","media/demo/demo-01.jpg":"image/jpeg","media/demo/demo-02.jpg":"image/jpeg","media/demo/demo-03.jpg":"image/jpeg","media/demo/demo-04.jpg":"image/jpeg","media/demo/demo-05.jpg":"image/jpeg","media/demo/demo-06.jpg":"image/jpeg"};
'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const samples = [
  ['photo-1501386761578-eac5c94b800a', '灯亮起的那一刻', '灯海与合唱', '那晚，整个世界都在发光。'],
  ['photo-1470229722913-7c0e2dbbafd3', '把心跳交给舞台', '霓虹之夜', '前奏响起，就知道没有白等。'],
  ['photo-1459749411175-04bf5292ceea', '我们一起大声唱', '万人合唱', '不认识的人，也唱着同一首歌。'],
  ['photo-1506157786151-b8491531f063', '晚风也记得', '日落现场', '风吹过的时候，刚好唱到那一句。'],
  ['photo-1492684223066-81342ee5ff30', '舍不得说再见', '安可时刻', '再一首，再让时间慢一点。'],
  ['photo-1516280440614-37939bbacd81', '把这一秒留下', '聚光之下', '有些声音，会在心里住很久。']
].map((p,i)=>({id:`demo-${i}`,src:bundledDemoImages[p[0]],title:p[1],album:p[2],note:p[3],date:'',location:'示例现场',demo:true,favorite:false}));
let archiveEditedAt=0;
let photos = samples.map(p=>({...p})), settings = {theme:'paper',color:'#f6f4ed',dim:.2,background:null,volume:.6,qq:''}, music = null;
let db, storageOK = true, current = 0, filter = 'all', auto = !matchMedia('(prefers-reduced-motion: reduce)').matches, timer, lightboxId, toastTimer, activePanel, selectedFiles = [];
const themes = {paper:'#f6f4ed',sage:'#eef1e7',rose:'#f5ebe5',blue:'#ebf0f3'};
const audio = $('#audio');
function audioStatus(message){const label=document.getElementById('playbackStatus');if(label)label.textContent=message}
function clearAudioSource(){
  audio.pause();audio.removeAttribute('src');audio.load();
  if(audio._encoreObjectURL)URL.revokeObjectURL(audio._encoreObjectURL);
  audio._encoreObjectURL=null;audio._encoreSource=null;
  audioStatus('还没有选择背景音乐');
}
function setAudioSource(source){
  if(audio._encoreSource===source&&audio.getAttribute('src'))return;
  clearAudioSource();
  let playable=source;
  try{
    const match=/^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/.exec(source);
    if(match){
      const raw=atob(match[2]),parts=[];
      for(let start=0;start<raw.length;start+=65536){
        const part=raw.slice(start,start+65536),bytes=new Uint8Array(part.length);
        for(let i=0;i<part.length;i++)bytes[i]=part.charCodeAt(i);
        parts.push(bytes);
      }
      playable=URL.createObjectURL(new Blob(parts,{type:match[1]}));
      audio._encoreObjectURL=playable;
    }
  }catch(error){playable=source}
  audio._encoreSource=source;audio.src=playable;audio.load();
  audioStatus('音乐已载入，请点击播放；也可使用下方系统播放控件');
}
function audioFailure(error){
  let message;
  if(error?.name==='NotAllowedError')message='浏览器未允许播放：请直接点击下方系统播放键，或在浏览器中打开文件后重试';
  else if(error?.name==='AbortError')message='播放已中断，请重新点击播放';
  else{
    const code=audio.error?.code;
    message=code===2?'音频读取失败，请重新保存完整 HTML 文件后打开':
      code===3?'浏览器解码失败，请先单独播放导出的 MP3 测试':
      code===4||error?.name==='NotSupportedError'?'当前浏览器未能加载这段音频，请换浏览器打开，或单独播放导出的 MP3 测试':
      '播放失败，请查看系统播放控件，并尝试在其他浏览器中打开';
    if(code)message+='（音频错误 '+code+'）';
    else if(error?.name)message+='（'+error.name+'）';
  }
  audioStatus(message);setPlayerExpanded(true);toast(message);
}
function setupMobileAudio(){
  let slot=document.getElementById('nativeAudioSlot');
  if(!slot){
    slot=document.createElement('div');slot.id='nativeAudioSlot';slot.className='native-audio-slot';
    document.querySelector('.music-player').append(slot);
    slot.append(audio);
    const label=document.createElement('p');label.id='playbackStatus';label.setAttribute('role','status');slot.append(label);
  }
  audio.controls=true;audio.setAttribute('playsinline','');audio.setAttribute('webkit-playsinline','');audio.setAttribute('aria-label','系统音乐播放器');
  audioStatus('选择音乐后点击播放；手机请调整媒体音量');
  audio.addEventListener('loadedmetadata',()=>audioStatus('音乐已就绪，请点击播放'));
  audio.addEventListener('playing',()=>audioStatus(audio.muted||audio.volume===0?'播放器已静音，请调整音乐音量':'正在播放 · 若没有声音，请检查手机媒体音量和蓝牙输出'));
  audio.addEventListener('pause',()=>{if(audio.getAttribute('src')&&!audio.error)audioStatus('音乐已暂停，点击播放继续')});
  audio.addEventListener('waiting',()=>audioStatus('正在等待音频，请稍候；长时间无响应可重新点击播放'));
  audio.addEventListener('stalled',()=>audioStatus('音频读取暂时停顿，请尝试系统播放键'));
}

let playlist=[],musicIndex=0,playMode='list';
function archiveState(){return {format:'encore-memories',version:2,photos,settings,playlist,musicIndex,playMode,_editedAt:archiveEditedAt}}
function loadMusicState(state){
  playlist=Array.isArray(state.playlist)?state.playlist:(state.music?[state.music]:[]);
  musicIndex=Number.isInteger(state.musicIndex)&&state.musicIndex>=0&&state.musicIndex<playlist.length?state.musicIndex:0;
  playMode=state.playMode==='single'?'single':'list';
  music=playlist[musicIndex]||null;audio.loop=playMode==='single';
}
function validateMusicArchive(data){
  const songs=data.version===2?data.playlist:(data.music?[data.music]:[]);
  if(!Array.isArray(songs)||songs.length>2000)throw Error('备份中的歌单数据无效');
  for(const song of songs)if(!song||typeof song.name!=='string'||typeof song.src!=='string'||!((Object.hasOwn(websiteMediaTypes,song.src)&&/^(audio\/|application\/octet-stream)/.test(websiteMediaTypes[song.src]))||/^data:(audio\/[\w.+-]+|application\/octet-stream);base64,[A-Za-z0-9+/=]+$/.test(song.src)))throw Error('备份中的音乐数据无效');
  if(data.version===2&&(!Number.isInteger(data.musicIndex)||data.musicIndex<0||data.musicIndex>=Math.max(1,songs.length)||!['single','list'].includes(data.playMode)))throw Error('备份中的歌单设置无效');
}
function modeLabel(){return playMode==='single'?'单曲循环':'歌单循环'}
function musicPanelMarkup(){return `<h2>让回忆，有声音。</h2><p>把现场的歌，收藏成一张专属歌单。</p>
  <div class="music-tabs"><button class="selected" data-music-tab="local">我的歌单</button><button data-music-tab="qq">QQ 音乐</button></div>
  <div id="localMusic"><label class="dropzone"><b>♫</b><strong>添加歌曲 · 可以一次选择多首</strong><small>MP3 / M4A / WAV / OGG / FLAC · 每首不超过 80 MB</small><input id="audioFile" type="file" accept="audio/*,.flac,.mp3,.m4a,.wav,.ogg" multiple class="file-hidden"></label>
  <p id="musicFileLabel">已保存 ${playlist.length} 首歌曲，继续添加不会覆盖已有歌曲。</p>
  <div class="playlist-options"><label for="playMode">播放方式</label><select id="playMode"><option value="list" ${playMode==='list'?'selected':''}>歌单循环 · 按顺序播放全部歌曲</option><option value="single" ${playMode==='single'?'selected':''}>单曲循环 · 重复当前歌曲</option></select></div>
  <div id="playlistRows" class="playlist-rows" aria-label="已保存的歌曲"></div>
  <label class="field">音量<input id="panelVolume" type="range" min="0" max="1" step=".01" value="${settings.volume}"></label>
  <p class="subtle-note">添加后会先保存在当前浏览器。启用原文件自动保存后，全部歌曲会自动写回绑定的 HTML；也可点击「下载副本」手动导出。歌曲越多，文件越大。首次播放请点击播放键；QQ 音乐的加密下载文件无法直接播放。</p>
  <div class="dialog-actions"><button class="button outline" id="panelPrevious">上一首</button><button class="button outline" id="panelNext">下一首</button><button class="button dark" id="panelPlay">${audio.paused?'播放音乐 ▶':'暂停音乐 Ⅱ'}</button></div></div>
  <div id="qqMusic" hidden><label class="field">QQ 音乐分享链接<input id="qqLink" type="url" placeholder="https://y.qq.com/..." value="${esc(settings.qq)}"></label><p class="subtle-note">QQ 音乐分享链接用于跳转播放。要加入本站歌单，请选择自己已有的普通音频文件。</p><div class="dialog-actions"><button class="button outline" id="saveQQ">保存链接</button><button class="button dark" id="openQQ">前往 QQ 音乐 ↗</button></div></div>`}
function renderPlaylist(){
  const root=$('#playlistRows');if(!root)return;
  root.innerHTML=playlist.length?playlist.map((song,index)=>`<div class="playlist-row ${index===musicIndex?'is-current':''}"><button class="playlist-song" data-track="${index}" aria-label="${index===musicIndex&&!audio.paused?'暂停':'播放'}：${esc(song.name)}"><span class="playlist-number">${index===musicIndex&&!audio.paused?'Ⅱ':String(index+1).padStart(2,'0')}</span><span class="playlist-title">${esc(song.name)}${index===musicIndex?'<small>当前歌曲</small>':''}</span><span aria-hidden="true">${index===musicIndex&&!audio.paused?'Ⅱ':'▶'}</span></button><button class="playlist-remove" data-remove-track="${index}" aria-label="移除：${esc(song.name)}">移除</button></div>`).join(''):'<p class="playlist-empty">歌单还是空的，添加几首属于这些夜晚的歌吧。</p>';
  $$('[data-track]',root).forEach(button=>button.onclick=()=>{const index=Number(button.dataset.track);if(index===musicIndex)toggleMusic();else selectTrack(index,true)});
  $$('[data-remove-track]',root).forEach(button=>button.onclick=()=>removeTrack(Number(button.dataset.removeTrack)));
  if($('#musicFileLabel')&&!$('#audioFile')?.disabled)$('#musicFileLabel').textContent=`已保存 ${playlist.length} 首歌曲，继续添加不会覆盖已有歌曲。`;
  if($('#panelPrevious'))$('#panelPrevious').disabled=playlist.length<2;
  if($('#panelNext'))$('#panelNext').disabled=playlist.length<2;
}
function updateTrack(){
  $('#trackName').textContent=music?.name||'给回忆配一首歌';
  $('#trackSub').textContent=music?`${musicIndex+1} / ${playlist.length} · ${modeLabel()}`:'添加多首歌曲，收藏你的现场歌单';
  $('#musicTime').textContent=`${Math.floor(audio.currentTime/60)||0}:${String(Math.floor(audio.currentTime%60)||0).padStart(2,'0')}`;
  if($('#musicList'))$('#musicList').textContent=`歌单 · ${playlist.length} 首`;
  if($('#musicMode'))$('#musicMode').textContent=modeLabel();
  if($('#musicPrevious'))$('#musicPrevious').disabled=playlist.length<2;
  if($('#musicNext'))$('#musicNext').disabled=playlist.length<2;
  if($('#playMode'))$('#playMode').value=playMode;
  renderPlaylist();playbackState();updateCompactProgress();updateCompactTrackButtons();
}
function playCurrentTrack(){
  if(!music){openPanel('music');return Promise.resolve()}
  try{
    setAudioSource(music.src);audio.muted=false;audioStatus('正在请求播放…');
    return Promise.resolve(audio.play()).catch(audioFailure);
  }catch(error){audioFailure(error);return Promise.resolve()}
}
function toggleMusic(){if(!music){openPanel('music');return}if(!audio.paused)audio.pause();else return playCurrentTrack()}
function selectTrack(index,shouldPlay=false){
  if(!playlist.length)return;
  musicIndex=((index%playlist.length)+playlist.length)%playlist.length;
  music=playlist[musicIndex];setAudioSource(music.src);audio.currentTime=0;
  audio.loop=playMode==='single';updateTrack();
  // Keep play() within the click handler; saving must not consume the user gesture.
  const playing=shouldPlay?playCurrentTrack():Promise.resolve();
  void persist();return playing;
}
function stepTrack(direction,shouldPlay=!audio.paused){return selectTrack(musicIndex+direction,shouldPlay)}
function setPlayMode(value){playMode=value==='single'?'single':'list';audio.loop=playMode==='single';updateTrack();void persist()}
function removeTrack(index){
  if(index<0||index>=playlist.length)return;
  const wasPlaying=!audio.paused,wasCurrent=index===musicIndex;
  playlist.splice(index,1);
  if(!playlist.length){musicIndex=0;music=null;clearAudioSource();updateTrack();void persist()}
  else if(wasCurrent){selectTrack(Math.min(index,playlist.length-1),wasPlaying)}
  else{if(index<musicIndex)musicIndex--;music=playlist[musicIndex];updateTrack();void persist()}
  toast('已从歌单移除这首歌曲');
}
async function addMusicFiles(files){
  const added=[],failed=[];
  for(const file of files){
    if(file.size>80*1024*1024){failed.push(file.name+'（超过 80 MB）');continue}
    if(/\.(qmc\w*|mflac\w*|mgg\w*)$/i.test(file.name)){failed.push(file.name+'（加密文件）');continue}
    try{added.push({name:file.name.replace(/\.[^.]+$/,''),src:await fileData(file)})}
    catch{failed.push(file.name+'（读取失败）')}
  }
  if(added.length){
    const hadMusic=!!music;playlist.push(...added);
    if(!hadMusic){musicIndex=0;music=playlist[0];setAudioSource(music.src);audio.loop=playMode==='single'}
    updateTrack();
  }
  return {added:added.length,failed,saved:added.length?await persist():false};
}
function setupPlaylistControls(){
  let controls=$('#playlistTransport');
  if(!controls){
    controls=document.createElement('div');controls.id='playlistTransport';controls.className='playlist-transport';
    controls.innerHTML='<button id="musicPrevious" aria-label="上一首歌曲">‹ 上一首</button><button id="musicList" data-panel="music">歌单 · 0 首</button><button id="musicMode" title="切换歌单循环或单曲循环">歌单循环</button><button id="musicNext" aria-label="下一首歌曲">下一首 ›</button>';
    $('.music-player').insertBefore(controls,$('#nativeAudioSlot'));
  }
  $('#musicPrevious').onclick=()=>stepTrack(-1);$('#musicNext').onclick=()=>stepTrack(1);
  $('#musicMode').onclick=()=>setPlayMode(playMode==='single'?'list':'single');
  audio.addEventListener('ended',()=>{if(playMode==='list'&&playlist.length)stepTrack(1,true)});
  audio.addEventListener('play',renderPlaylist);audio.addEventListener('pause',renderPlaylist);
}

function formatMusicClock(seconds){
  const value=Number.isFinite(seconds)&&seconds>=0?Math.floor(seconds):0;
  return Math.floor(value/60)+':'+String(value%60).padStart(2,'0');
}
function updateCompactProgress(){
  const seek=$('#musicSeek'),clock=$('#compactMusicTime');if(!seek||!clock)return;
  const duration=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0;
  const current=Number.isFinite(audio.currentTime)?Math.max(0,audio.currentTime):0;
  seek.disabled=!duration;
  if(!seek._encoreDragging)seek.value=duration?String(Math.round(Math.min(1,current/duration)*1000)):'0';
  const preview=seek._encoreDragging&&duration?Number(seek.value)/1000*duration:current;
  clock.textContent=formatMusicClock(preview)+' / '+(duration?formatMusicClock(duration):'--:--');
  seek.setAttribute('aria-valuetext',formatMusicClock(preview)+(duration?'，共 '+formatMusicClock(duration):''));
  seek.style.setProperty('--seek-progress',(Number(seek.value)/10)+'%');
}
function setPlayerExpanded(expanded){
  const player=$('.music-player'),button=$('.music-more');if(!player||!button)return;
  player.classList.toggle('is-expanded',!!expanded);
  button.setAttribute('aria-expanded',String(!!expanded));
  button.setAttribute('aria-label',expanded?'收起音乐控制':'展开音乐控制');
  button.title=expanded?'收起音乐控制':'展开音乐控制';
}
function updateCompactTrackButtons(){for(const id of ['compactPrevious','compactNext']){const button=$('#'+id);if(button)button.disabled=playlist.length<2}}
function setupCompactPlayer(){
  const player=$('.music-player');
  let controls=$('#compactPlayback');
  if(!controls){
    controls=document.createElement('div');controls.id='compactPlayback';controls.className='compact-playback';
    const progress=document.createElement('div');progress.className='compact-progress';
    progress.innerHTML='<input id="musicSeek" type="range" min="0" max="1000" step="1" value="0" disabled aria-label="歌曲播放进度"><span id="compactMusicTime" class="compact-music-time">0:00 / --:--</span>';
    controls.append($('#musicPlay'),progress);
    player.insertBefore(controls,$('.music-more'));
  }
  // These live beside the seek bar, including when the extra controls are collapsed.
  for(const [id,label,icon] of [['compactPrevious','上一首歌曲','M4 3h2v14H4zM16 3v14L7 10z'],['compactNext','下一首歌曲','M14 3h2v14h-2zM4 3l9 7-9 7z']]){
    let button=$('#'+id);
    if(!button){button=document.createElement('button');button.id=id;button.className='compact-step';button.type='button';button.setAttribute('aria-label',label);button.title=label;button.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="'+icon+'"/></svg>'}
    controls.insertBefore(button,id==='compactPrevious'?$('#musicPlay'):controls.querySelector('.compact-progress'));
    button.onclick=()=>stepTrack(id==='compactPrevious'?-1:1);
  }
  updateCompactTrackButtons();
  const more=$('.music-more');more.removeAttribute('data-panel');
  more.setAttribute('aria-controls','playlistTransport nativeAudioSlot');
  more.onclick=()=>setPlayerExpanded(!player.classList.contains('is-expanded'));
  player.addEventListener('keydown',event=>{if(event.key==='Escape'){setPlayerExpanded(false);more.focus()}});
  setPlayerExpanded(false);
  const seek=$('#musicSeek');
  seek.oninput=()=>{seek._encoreDragging=true;updateCompactProgress()};
  seek.onchange=()=>{
    const duration=audio.duration;
    if(Number.isFinite(duration)&&duration>0){
      try{audio.currentTime=Math.max(0,Math.min(duration,Number(seek.value)/1000*duration))}
      catch{audioStatus('暂时无法跳转，请展开系统播放控件重试');setPlayerExpanded(true)}
    }
    seek._encoreDragging=false;updateCompactProgress();
  };
  seek.onblur=seek.onpointercancel=()=>{seek._encoreDragging=false;updateCompactProgress()};
  for(const event of ['timeupdate','loadedmetadata','durationchange','emptied','ended'])audio.addEventListener(event,()=>{if(event==='emptied')seek._encoreDragging=false;updateCompactProgress()});
  updateCompactProgress();
}

let activeInlineEdit=null,lastInlineTap=null,inlinePointer=null;
function photoInlineValue(photo,field){
  if(field==='caption')return typeof photo.caption==='string'?photo.caption:(photo.date||(photo.demo?'示例回忆':'我的回忆'));
  if(field==='description')return typeof photo.description==='string'?photo.description:(photo.note||photo.location||'属于我的现场瞬间');
  return photo[field]||'';
}
function inlinePhotoAttributes(photo,field,label,classes=''){return `class="inline-photo-text ${classes}" data-inline-photo="${esc(photo.id)}" data-inline-field="${field}" tabindex="0" role="button" aria-label="编辑${label}：${esc(photoInlineValue(photo,field))}，双击或按回车"`}
function refreshInlinePhotoText(photo){
  for(const host of $$('[data-inline-photo]',$('#photoGrid'))){
    if(host.dataset.inlinePhoto!==photo.id||host===activeInlineEdit?.host)continue;
    host.textContent=photoInlineValue(photo,host.dataset.inlineField);
    host.setAttribute('aria-label','编辑文字：'+host.textContent+'，双击或按回车');
  }
  for(const image of $$('[data-photo]',$('#photoGrid')))if(image.dataset.photo===photo.id){image.setAttribute('aria-label','查看 '+photo.title);const img=image.querySelector('img');if(img)img.alt=photo.title}
  renderCarousel();if($('#lightbox').open)updateLightbox();
}
function finishInlineEdit(save=true,{refresh=true}={}){
  const edit=activeInlineEdit;if(!edit)return Promise.resolve(false);
  activeInlineEdit=null;
  let changed=false;
  if(save){
    const value=edit.input.value.trim().slice(0,edit.limit);
    const next=edit.field==='title'?(value||'未命名的回忆'):value;
    if(next!==edit.original){
      edit.photo[edit.field]=next;
      if(edit.field==='description')edit.photo.note=next;
      changed=true;
    }
  }
  edit.host.classList.remove('is-inline-editing');
  edit.host.setAttribute('role','button');edit.host.tabIndex=0;
  edit.host.textContent=photoInlineValue(edit.photo,edit.field);
  edit.host.setAttribute('aria-label','编辑文字：'+edit.host.textContent+'，双击或按回车');
  if(refresh&&changed)refreshInlinePhotoText(edit.photo);
  if(!changed){originalSaveUI();return Promise.resolve(false)}
  // Update the in-memory archive immediately, including an export clicked before blur.
  return persist().then(saved=>{if(saved)toast(inlineSaveNotice());return saved});
}
function beginInlineEdit(host){
  if(activeInlineEdit?.host===host)return;
  if(activeInlineEdit)finishInlineEdit(true);
  const photo=photos.find(item=>item.id===host.dataset.inlinePhoto),field=host.dataset.inlineField;
  if(!photo||!['title','caption','description','album'].includes(field))return;
  const original=photoInlineValue(photo,field),limit=field==='description'?1000:60;
  const wrapper=document.createElement('div');wrapper.className='inline-edit-box';
  const input=document.createElement(field==='description'?'textarea':'input');
  if(field!=='description')input.type='text';else input.rows=2;
  input.className='inline-edit-input';input.maxLength=limit;input.value=original;
  input.setAttribute('aria-label',{title:'照片标题',caption:'照片旁的小字',description:'照片描述',album:'演唱会或相册名'}[field]);
  const actions=document.createElement('div');actions.className='inline-edit-actions';
  const done=document.createElement('button');done.type='button';done.textContent='完成';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='取消';
  actions.append(done,cancel);wrapper.append(input,actions);
  host.replaceChildren(wrapper);host.classList.add('is-inline-editing');host.removeAttribute('role');host.tabIndex=-1;
  const edit={host,photo,field,original,limit,input,composing:false};activeInlineEdit=edit;
  input.oninput=originalSaveUI;
  input.oncompositionstart=()=>edit.composing=true;input.oncompositionend=()=>edit.composing=false;
  input.onkeydown=event=>{
    event.stopPropagation();
    if(event.isComposing||edit.composing||event.keyCode===229)return;
    if(event.key==='Escape'){event.preventDefault();finishInlineEdit(false);host.focus({preventScroll:true})}
    else if(event.key==='Enter'&&!(field==='description'&&event.shiftKey)){event.preventDefault();finishInlineEdit(true);host.focus({preventScroll:true})}
  };
  done.onclick=()=>finishInlineEdit(true);
  cancel.onpointerdown=cancel.onmousedown=event=>{event.preventDefault();if(activeInlineEdit===edit)finishInlineEdit(false)};
  cancel.onclick=()=>finishInlineEdit(false);
  wrapper.addEventListener('focusout',event=>{
    if(wrapper.contains(event.relatedTarget))return;
    setTimeout(()=>{if(activeInlineEdit===edit&&!wrapper.contains(document.activeElement))finishInlineEdit(true)},0);
  });
  input.focus({preventScroll:true});input.select();
}
function setupInlinePhotoEditing(){
  const grid=$('#photoGrid');
  const target=event=>{const host=event.target.closest('[data-inline-photo]');return host&&grid.contains(host)?host:null};
  grid.addEventListener('dblclick',event=>{const host=target(event);if(!host||activeInlineEdit?.host===host)return;event.preventDefault();event.stopPropagation();beginInlineEdit(host)});
  grid.addEventListener('keydown',event=>{const host=target(event);if(!host||activeInlineEdit?.host===host)return;if(['Enter',' ','F2'].includes(event.key)){event.preventDefault();beginInlineEdit(host)}});
  grid.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')inlinePointer={x:event.clientX,y:event.clientY,time:event.timeStamp}});
  grid.addEventListener('pointercancel',()=>{inlinePointer=null;lastInlineTap=null});
  grid.addEventListener('pointerup',event=>{
    if(event.pointerType!=='touch')return;
    const start=inlinePointer;inlinePointer=null;const host=target(event);
    if(activeInlineEdit?.host===host){lastInlineTap=null;return}
    if(!host||!start||event.timeStamp-start.time>350||Math.hypot(event.clientX-start.x,event.clientY-start.y)>12){lastInlineTap=null;return}
    if(lastInlineTap?.host===host&&event.timeStamp-lastInlineTap.time<380){
      lastInlineTap=null;if(event.cancelable)event.preventDefault();beginInlineEdit(host);
    }else lastInlineTap={host,time:event.timeStamp};
  });
}

const photoViewer={scale:1,x:0,y:0,width:0,height:0,photoId:null,pointers:new Map(),gesture:null};
function clampPhotoScale(value){return Math.min(6,Math.max(.5,value))}
function applyPhotoTransform(){
  const viewport=$('#photoViewport'),image=$('#lightboxImage');if(!viewport||!image)return;
  const maxX=Math.max(0,(photoViewer.width*photoViewer.scale-viewport.clientWidth)/2);
  const maxY=Math.max(0,(photoViewer.height*photoViewer.scale-viewport.clientHeight)/2);
  photoViewer.x=Math.max(-maxX,Math.min(maxX,photoViewer.x));photoViewer.y=Math.max(-maxY,Math.min(maxY,photoViewer.y));
  image.style.transform=`translate(-50%,-50%) translate(${photoViewer.x}px,${photoViewer.y}px) scale(${photoViewer.scale})`;
  viewport.classList.toggle('is-zoomed',photoViewer.scale>1.01);
  viewport.classList.toggle('is-panning',photoViewer.pointers.size>0&&photoViewer.scale>1.01);
  const ready=photoViewer.width>0&&photoViewer.height>0;
  $('#photoZoomLevel').textContent=Math.round(photoViewer.scale*100)+'%';
  $('#photoZoomOut').disabled=!ready||photoViewer.scale<=.5001;
  $('#photoZoomIn').disabled=!ready||photoViewer.scale>=5.9999;
  $('#photoZoomReset').disabled=!ready;
}
function resetPhotoZoom(){
  const viewport=$('#photoViewport');
  for(const id of photoViewer.pointers.keys())try{viewport?.releasePointerCapture(id)}catch{}
  photoViewer.pointers.clear();photoViewer.gesture=null;
  photoViewer.scale=1;photoViewer.x=0;photoViewer.y=0;applyPhotoTransform();
}
function fitPhotoViewport(reset=false){
  const image=$('#lightboxImage'),viewport=$('#photoViewport');
  if(!$('#lightbox').open||!image.naturalWidth||!image.naturalHeight||!viewport.clientWidth||!viewport.clientHeight)return;
  const factor=Math.min(viewport.clientWidth/image.naturalWidth,viewport.clientHeight/image.naturalHeight,1);
  photoViewer.width=image.naturalWidth*factor;photoViewer.height=image.naturalHeight*factor;
  image.style.width=photoViewer.width+'px';image.style.height=photoViewer.height+'px';image.style.visibility='visible';
  if(reset)resetPhotoZoom();else applyPhotoTransform();
}
function setViewedPhoto(photo){
  const image=$('#lightboxImage');
  if(photoViewer.photoId===photo.id&&image.getAttribute('src')===photo.src)return;
  resetPhotoZoom();photoViewer.photoId=photo.id;photoViewer.width=0;photoViewer.height=0;
  image.style.visibility='hidden';image.src=photo.src;applyPhotoTransform();
  if(image.complete)fitPhotoViewport(true);
}
function zoomPhotoTo(value,clientX,clientY){
  if(!photoViewer.width||!photoViewer.height)return;
  const viewport=$('#photoViewport'),rect=viewport.getBoundingClientRect();
  const offsetX=Number.isFinite(clientX)?clientX-rect.left-viewport.clientWidth/2:0;
  const offsetY=Number.isFinite(clientY)?clientY-rect.top-viewport.clientHeight/2:0;
  const next=clampPhotoScale(value),ratio=next/photoViewer.scale;
  photoViewer.x=offsetX-(offsetX-photoViewer.x)*ratio;photoViewer.y=offsetY-(offsetY-photoViewer.y)*ratio;
  photoViewer.scale=next;applyPhotoTransform();
}
function startPhotoGesture(){
  const points=[...photoViewer.pointers.values()];
  if(points.length<2){photoViewer.gesture=null;return}
  const [a,b]=points,viewport=$('#photoViewport'),rect=viewport.getBoundingClientRect();
  const x=(a.x+b.x)/2-rect.left-viewport.clientWidth/2,y=(a.y+b.y)/2-rect.top-viewport.clientHeight/2;
  photoViewer.gesture={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),scale:photoViewer.scale,contentX:(x-photoViewer.x)/photoViewer.scale,contentY:(y-photoViewer.y)/photoViewer.scale};
}
function handlePhotoZoomKey(event){
  if(event.ctrlKey||event.metaKey||event.altKey||event.target.matches('input,textarea,select,[contenteditable]'))return false;
  if(['+','=','-','0'].includes(event.key)){
    event.preventDefault();if(event.key==='0')resetPhotoZoom();else zoomPhotoTo(photoViewer.scale*(event.key==='-'?.8:1.25));return true;
  }
  if(photoViewer.scale>1.01&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
    event.preventDefault();photoViewer.x+=event.key==='ArrowLeft'?40:event.key==='ArrowRight'?-40:0;photoViewer.y+=event.key==='ArrowUp'?40:event.key==='ArrowDown'?-40:0;applyPhotoTransform();return true;
  }
  return false;
}
function setupPhotoZoom(){
  const image=$('#lightboxImage');let viewport=$('#photoViewport');
  if(!viewport){viewport=document.createElement('div');viewport.id='photoViewport';viewport.className='photo-viewport';image.parentElement.insertBefore(viewport,image);viewport.append(image)}
  viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-label','照片查看区，可滚轮缩放、双指缩放，放大后拖动');
  image.draggable=false;
  let toolbar=$('#photoZoomToolbar');
  if(!toolbar){
    toolbar=document.createElement('div');toolbar.id='photoZoomToolbar';toolbar.className='photo-zoom-toolbar';toolbar.setAttribute('aria-label','照片缩放控制');
    toolbar.innerHTML='<button id="photoZoomOut" aria-label="缩小照片">−</button><span id="photoZoomLevel" role="status" aria-live="polite">100%</span><button id="photoZoomIn" aria-label="放大照片">＋</button><button id="photoZoomReset">适应窗口</button><small class="zoom-desktop-hint">滚轮缩放 · 放大后拖动查看</small><small class="zoom-mobile-hint">双指缩放 · 放大后拖动查看</small>';
    viewport.after(toolbar);
  }
  $('#photoZoomOut').onclick=()=>zoomPhotoTo(photoViewer.scale*.8);$('#photoZoomIn').onclick=()=>zoomPhotoTo(photoViewer.scale*1.25);$('#photoZoomReset').onclick=resetPhotoZoom;
  image.addEventListener('load',()=>fitPhotoViewport(false));
  image.addEventListener('error',()=>{photoViewer.width=0;photoViewer.height=0;applyPhotoTransform()});
  viewport.addEventListener('wheel',event=>{if(!photoViewer.width)return;event.preventDefault();const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?viewport.clientHeight:1);zoomPhotoTo(photoViewer.scale*Math.exp(-Math.max(-600,Math.min(600,delta))*.0015),event.clientX,event.clientY)},{passive:false});
  viewport.addEventListener('dblclick',event=>{event.preventDefault();zoomPhotoTo(photoViewer.scale>1.1?1:2.5,event.clientX,event.clientY)});
  viewport.addEventListener('pointerdown',event=>{
    if(!photoViewer.width||(event.pointerType==='mouse'&&event.button!==0)||photoViewer.pointers.size>=2)return;
    event.preventDefault();viewport.focus({preventScroll:true});
    photoViewer.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    try{viewport.setPointerCapture(event.pointerId)}catch{}
    startPhotoGesture();applyPhotoTransform();
  });
  viewport.addEventListener('pointermove',event=>{
    const previous=photoViewer.pointers.get(event.pointerId);if(!previous)return;
    photoViewer.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(photoViewer.pointers.size===2){
      const [a,b]=[...photoViewer.pointers.values()],gesture=photoViewer.gesture;if(!gesture)return;
      const rect=viewport.getBoundingClientRect(),scale=clampPhotoScale(gesture.scale*Math.hypot(a.x-b.x,a.y-b.y)/gesture.distance);
      photoViewer.x=(a.x+b.x)/2-rect.left-viewport.clientWidth/2-gesture.contentX*scale;
      photoViewer.y=(a.y+b.y)/2-rect.top-viewport.clientHeight/2-gesture.contentY*scale;photoViewer.scale=scale;
    }else{photoViewer.x+=event.clientX-previous.x;photoViewer.y+=event.clientY-previous.y}
    applyPhotoTransform();
  });
  const endPointer=event=>{photoViewer.pointers.delete(event.pointerId);try{viewport.releasePointerCapture(event.pointerId)}catch{}startPhotoGesture();applyPhotoTransform()};
  viewport.addEventListener('pointerup',endPointer);viewport.addEventListener('pointercancel',endPointer);
  viewport.addEventListener('lostpointercapture',event=>{if(photoViewer.pointers.delete(event.pointerId)){startPhotoGesture();applyPhotoTransform()}});
  $('#lightbox').addEventListener('close',resetPhotoZoom);
  window.addEventListener('resize',()=>fitPhotoViewport(false));
  if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(()=>fitPhotoViewport(false));observer.observe(viewport)}
  applyPhotoTransform();
}

function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4000)}
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(document.documentElement.dataset.encoreInstance ? 'encore-memories-'+document.documentElement.dataset.encoreInstance : 'encore-memories',1);req.onupgradeneeded=()=>req.result.createObjectStore('archive');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
function readDB(){return new Promise((resolve,reject)=>{const req=db.transaction('archive').objectStore('archive').get('state');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function persist(){markArchiveChanged();if(!db||!storageOK){if(localFileSaving.handle&&!localFileSaving.paused&&!localFileSaving.binding)return await flushOriginalFile();toast('浏览器存储不可用，请导出备份，避免关闭后丢失。');return false}try{await new Promise((resolve,reject)=>{const tx=db.transaction('archive','readwrite');tx.objectStore('archive').put(archiveState(),'state');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});return true}catch(e){if(localFileSaving.handle&&!localFileSaving.paused&&!localFileSaving.binding&&await flushOriginalFile())return true;toast('保存失败：存储空间不足或不可用，请立即导出备份。');return false}}
function visiblePhotos(){return photos.filter(p=>filter==='all'||(filter==='mine'&&!p.demo)||(filter==='favorite'&&p.favorite))}
function render(){renderCarousel();renderGrid();$('#totalCount').textContent=photos.length;$('#mineCount').textContent=photos.filter(p=>!p.demo).length;$('#favCount').textContent=photos.filter(p=>p.favorite).length}
function renderCarousel(){const stage=$('#carouselStage');const existing=new Map([...stage.querySelectorAll('.slide')].map(el=>[el.dataset.id,el]));stage.querySelector('.empty-state')?.remove();if(!photos.length){stage.innerHTML='<div class="empty-state" style="margin:24px auto;max-width:550px"><h3>把你的第一张现场照片放在这里。</h3><button class="button dark" data-panel="upload">＋ 导入照片</button></div>';$('#slideTitle').textContent='等一场新的心动';$('#slideLabel').textContent='YOUR NEXT MEMORY';$('#slideMeta').textContent='添加照片，开始你的回忆放映';$('#slideCount').textContent='00 / 00';return}current=(current+photos.length)%photos.length;photos.forEach((p,i)=>{let offset=(i-current+photos.length)%photos.length;if(offset>photos.length/2)offset-=photos.length;const button=existing.get(p.id)||document.createElement('button');button.dataset.id=p.id;existing.delete(p.id);button.className='slide';button.dataset.offset=Math.abs(offset)>2?'hidden':offset;button.setAttribute('aria-label',`查看照片：${p.title}`);button.tabIndex=Math.abs(offset)>2?-1:0;button.innerHTML=`<img src="${esc(p.src)}" alt="${esc(p.title)}" draggable="false"><span>${String(i+1).padStart(2,'0')} / ${esc(p.album||'我的现场')}</span>`;button.onclick=()=>offset===0?openLightbox(p.id):move(offset);if(!button.isConnected)stage.append(button)});existing.forEach(el=>el.remove());const p=photos[current];$('#slideTitle').textContent=p.title;$('#slideMeta').textContent=[p.date,p.location,p.album].filter(Boolean).join(' · ');$('#slideLabel').textContent=p.demo?'DEMO / 示例回忆':'MY MEMORY / 我的回忆';$('#slideCount').textContent=`${String(current+1).padStart(2,'0')} / ${String(photos.length).padStart(2,'0')}`}
function renderGrid(){if(activeInlineEdit)finishInlineEdit(true);const list=visiblePhotos();$('#photoGrid').innerHTML=list.map(p=>`<article class="photo-card"><div class="photo-image" role="button" tabindex="0" data-photo="${esc(p.id)}" aria-label="查看 ${esc(p.title)}"><img src="${esc(p.src)}" alt="${esc(p.title)}" loading="lazy"><button class="favorite ${p.favorite?'is-favorite':''}" data-fav="${esc(p.id)}" aria-label="${p.favorite?'取消收藏':'收藏'} ${esc(p.title)}" aria-pressed="${p.favorite}">${p.favorite?'♥':'♡'}</button></div><div class="photo-info"><h3 ${inlinePhotoAttributes(p,'title','照片标题')}>${esc(p.title)}</h3><small ${inlinePhotoAttributes(p,'caption','照片旁的小字')}>${esc(photoInlineValue(p,'caption'))}</small></div><p ${inlinePhotoAttributes(p,'description','照片描述','photo-description')}>${esc(photoInlineValue(p,'description'))}</p></article>`).join('');$('#emptyState').hidden=!!list.length;$('#emptyCopy').textContent=filter==='favorite'?'点击照片上的爱心，把喜欢的瞬间收藏在一起。':'导入你的现场照片，写下只属于你的故事。'}
function move(step){if(!photos.length)return;current=(current+step+photos.length)%photos.length;renderCarousel();resetTimer()}
function resetTimer(){clearInterval(timer);if(auto&&photos.length>1)timer=setInterval(()=>{if(!document.hidden&&!$('#settingsDialog').open&&!$('#lightbox').open){current=(current+1)%photos.length;renderCarousel()}},4200);$('#autoplay').textContent=auto?'Ⅱ':'▶';$('#autoplay').setAttribute('aria-label',auto?'暂停自动轮播':'开始自动轮播')}
$('#previous').onclick=()=>move(-1);$('#next').onclick=()=>move(1);$('#autoplay').onclick=()=>{auto=!auto;resetTimer()};
$('#carousel').onkeydown=e=>{if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}if(e.key==='ArrowRight'){e.preventDefault();move(1)}};
let touchX;$('#carousel').addEventListener('touchstart',e=>touchX=e.touches[0].clientX,{passive:true});$('#carousel').addEventListener('touchend',e=>{if(touchX==null)return;const delta=e.changedTouches[0].clientX-touchX;if(Math.abs(delta)>40)move(delta<0?1:-1);touchX=null},{passive:true});
$$('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;$$('[data-filter]').forEach(x=>x.classList.toggle('selected',x===b));renderGrid()});
async function favorite(id){const p=photos.find(p=>p.id===id);if(!p)return;p.favorite=!p.favorite;render();if($('#lightbox').open)updateLightbox();await persist()}
$('#photoGrid').onclick=e=>{if(e.target.closest('[data-inline-photo]'))return;const fav=e.target.closest('[data-fav]');if(fav){favorite(fav.dataset.fav);return}const p=e.target.closest('[data-photo]');if(p)openLightbox(p.dataset.photo)};
$('#photoGrid').onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-photo]')){e.preventDefault();openLightbox(e.target.dataset.photo)}};
function openLightbox(id){finishInlineEdit(true);lightboxId=id;if(!$('#lightbox').open)$('#lightbox').showModal();updateLightbox();resetPhotoZoom();$('#lightbox').scrollTop=0;requestAnimationFrame(()=>fitPhotoViewport(true))}
function updateLightbox(){const p=photos.find(p=>p.id===lightboxId);if(!p)return;setViewedPhoto(p);$('#lightboxImage').alt=p.title;$('#lightboxTitle').textContent=p.title;$('#lightboxMeta').textContent=[p.demo?'示例回忆':p.date,p.location,p.album].filter(Boolean).join(' · ');$('#lightboxNote').textContent=p.note;$('#lightboxFav').textContent=p.favorite?'♥':'♡';$('#lightboxFav').setAttribute('aria-label',p.favorite?'取消收藏':'收藏照片');$('#lightboxFav').style.color=p.favorite?'var(--accent)':''}
function moveLightbox(step){const i=photos.findIndex(p=>p.id===lightboxId);if(photos.length){lightboxId=photos[(i+step+photos.length)%photos.length].id;updateLightbox()}}
$('#closeLightbox').onclick=()=>$('#lightbox').close();$('#lightboxPrev').onclick=()=>moveLightbox(-1);$('#lightboxNext').onclick=()=>moveLightbox(1);$('#lightboxFav').onclick=()=>favorite(lightboxId);
$('#lightbox').onkeydown=e=>{if(handlePhotoZoomKey(e))return;if(e.key==='ArrowLeft')moveLightbox(-1);if(e.key==='ArrowRight')moveLightbox(1)};
$('#deletePhoto').onclick=()=>{const p=photos.find(p=>p.id===lightboxId);$('#lightbox').close();openPanel('delete',p)};
$('#editPhoto').onclick=()=>{const p=photos.find(p=>p.id===lightboxId);$('#lightbox').close();openPanel('edit',p)};
function fileData(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file)})}
const PHOTO_FILE_LIMIT=200*1024*1024,PHOTO_MAX_EDGE=2200;
async function imageHeaderSize(file){
  try{
    const buffer=await file.slice(0,512*1024).arrayBuffer(),view=new DataView(buffer),bytes=new Uint8Array(buffer);
    if(bytes.length>=24&&view.getUint32(0)===0x89504e47&&view.getUint32(4)===0x0d0a1a0a)return {width:view.getUint32(16),height:view.getUint32(20)};
    if(bytes.length>=4&&view.getUint16(0)===0xffd8){
      let offset=2;
      while(offset+4<=bytes.length){
        if(bytes[offset]!==0xff){offset++;continue}
        const marker=bytes[offset+1];if(marker===0xda||marker===0xd9)break;
        if(marker===0xff){offset++;continue}if(marker===0x01||marker>=0xd0&&marker<=0xd8){offset+=2;continue}
        const length=view.getUint16(offset+2);if(length<2||offset+length+2>bytes.length)break;
        if(marker>=0xc0&&marker<=0xcf&&![0xc4,0xc8,0xcc].includes(marker)&&length>=7)return {width:view.getUint16(offset+7),height:view.getUint16(offset+5)};
        offset+=length+2;
      }
    }
    if(bytes.length>=30&&view.getUint32(0)===0x52494646&&view.getUint32(8)===0x57454250){
      if(view.getUint32(12)===0x56503858)return {width:1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16),height:1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16)};
      if(view.getUint32(12)===0x56503820&&bytes[23]===0x9d&&bytes[24]===1&&bytes[25]===0x2a)return {width:view.getUint16(26,true)&0x3fff,height:view.getUint16(28,true)&0x3fff};
    }
  }catch{}
  return null;
}
function compressPhotoSource(source){
  const width=source.naturalWidth||source.width,height=source.naturalHeight||source.height;
  if(!width||!height)throw Error('图片没有有效尺寸，请换用普通 JPG、PNG 或 WebP');
  const scale=Math.min(1,PHOTO_MAX_EDGE/Math.max(width,height)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
  try{
    const context=canvas.getContext('2d');if(!context)throw Error('无法创建图片处理区域');
    context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);
    context.drawImage(source,0,0,canvas.width,canvas.height);
    const result=canvas.toDataURL('image/jpeg',.88);
    if(!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(result))throw Error('图片压缩失败');
    return result;
  }finally{canvas.width=1;canvas.height=1}
}
async function imageData(file){
  if(!file||!Number.isFinite(file.size))throw Error('请选择图片文件');
  if(!file.type.startsWith('image/')&&!/\.(jpe?g|png|webp|avif)$/i.test(file.name||''))throw Error('请选择 JPG、PNG、WebP 或 AVIF 图片');
  if(file.size>PHOTO_FILE_LIMIT)throw Error('单张图片不能超过 200 MB，请先压缩后再添加');
  if(!file.size)throw Error('图片文件为空，请重新选择');
  let bitmap;
  if(typeof createImageBitmap==='function'){
    try{
      const size=await imageHeaderSize(file),options={imageOrientation:'from-image',resizeQuality:'high'};
      if(size&&Math.max(size.width,size.height)>PHOTO_MAX_EDGE)options[size.height>size.width?'resizeHeight':'resizeWidth']=PHOTO_MAX_EDGE;
      bitmap=await createImageBitmap(file,options);
      return compressPhotoSource(bitmap);
    }catch{}finally{bitmap?.close?.()}
  }
  // Decode from the original Blob, avoiding a second full-size base64 copy in memory.
  return new Promise((resolve,reject)=>{
    const image=new Image();let href;
    const clean=()=>{if(href)URL.revokeObjectURL(href);image.onload=image.onerror=null;image.removeAttribute('src')};
    image.onload=()=>{try{const result=compressPhotoSource(image);clean();resolve(result)}catch{clean();reject(Error('图片处理失败，可能是分辨率过高或手机内存不足；请先缩小图片后重试'))}};
    image.onerror=()=>{clean();reject(Error('图片无法解码，可能是格式不受支持、文件损坏或分辨率过高；请转换为 JPG、PNG 或 WebP 后重试'))};
    try{href=URL.createObjectURL(file);image.src=href}catch{clean();reject(Error('当前浏览器无法读取这张图片，请换一个普通图片文件重试'))}
  });
}

const memoryFields = p=>`<label class="field">回忆标题<input id="memoryTitle" maxlength="60" placeholder="比如：终于听到那首歌" value="${esc(p?.title||'')}"></label><div class="field-row"><label class="field">演唱会 / 相册<input id="memoryAlbum" maxlength="60" placeholder="我的第一场演唱会" value="${esc(p?.album||'')}"></label><label class="field">现场日期<input id="memoryDate" type="date" value="${esc(p?.date||'')}"></label></div><label class="field">地点<input id="memoryLocation" maxlength="80" placeholder="城市 · 场馆" value="${esc(p?.location||'')}"></label><label class="field">写给这一天<textarea id="memoryNote" maxlength="1000" placeholder="还记得那一刻的心情吗？">${esc(p?.note||'')}</textarea></label>`;
function fields(){return {title:$('#memoryTitle').value.trim(),album:$('#memoryAlbum').value.trim(),date:$('#memoryDate').value,location:$('#memoryLocation').value.trim(),note:$('#memoryNote').value.trim()}}
function closePanel(){$('#settingsDialog').close();activePanel=null}
function openPanel(name,p){finishInlineEdit(true);activePanel=name;selectedFiles=[];const root=$('#panelContent');const content={
upload:`<h2>收藏一个新瞬间。</h2><p>照片会保存在此浏览器，随时回来，再看一遍。</p><label class="dropzone" id="dropzone"><b>＋</b><strong id="selectedLabel">点击选择，或把照片拖到这里</strong><small>支持 JPG / PNG / WebP · 可批量选择 · 每张不超过 200 MB · 自动压缩后保存</small><input class="file-hidden" id="photoFiles" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple></label>${memoryFields()}<div class="dialog-actions"><button class="button outline" data-close>取消</button><button class="button dark" id="savePhotos">保存到我的现场 ↗</button></div>`,
edit:`<h2>让回忆更完整。</h2>${memoryFields(p)}<div class="dialog-actions"><button class="button outline" data-close>取消</button><button class="button dark" id="saveEdit">保存回忆</button></div>`,
delete:`<h2>告别这张照片？</h2><p>「${esc(p?.title)}」将从此浏览器的回忆册中删除。建议先导出备份。</p><div class="dialog-actions"><button class="button outline" data-close>保留回忆</button><button class="button dark" id="confirmDelete">删除照片</button></div>`,
appearance:`<h2>布置你的回忆空间。</h2><p>换一种底色，让那天的氛围回来。</p><div class="theme-options">${Object.entries(themes).map(([key,color])=>`<button class="theme-button ${settings.theme===key?'checked':''}" data-theme="${key}" style="--swatch:${color}">${{paper:'奶油胶片',sage:'苔绿来信',rose:'日落余温',blue:'蓝调时刻'}[key]}</button>`).join('')}</div><label class="field">自由选择背景色<input type="color" id="backgroundColor" value="${esc(settings.color)}"></label><label class="dropzone"><b>↥</b><strong>用自己的照片作为背景</strong><small>每张不超过 200 MB · 自动压缩后保存</small><input type="file" id="backgroundFile" accept="image/*" class="file-hidden"></label><label class="field">背景照片浓度 <input id="backgroundDim" type="range" min="0" max=".75" step=".01" value="${settings.dim}"></label><div class="dialog-actions"><button class="button outline" id="clearBackground">移除背景照片</button><button class="button dark" id="saveAppearance">保存布置</button></div>`,
music:musicPanelMarkup(),
help:`<h2>把现场，留在这里。</h2><ol class="help-list"><li><b>收藏回忆：</b>批量导入照片，填写演唱会、日期、地点和文字。双击照片下方的标题、小字或描述可直接修改，点击空白处自动保存；按 Esc 可取消。点击照片可查看大图、编辑或删除。</li><li><b>回忆转盘：</b>照片每 4.2 秒自动循环。可暂停、点击左右箭头、使用键盘方向键，或在手机上左右滑动。</li><li><b>布置空间：</b>选择底色或导入背景照片，用浓度滑块调节氛围。</li><li><b>背景音乐：</b>可批量添加多首普通音频，在歌单中切歌或移除歌曲，支持歌单循环和单曲循环。QQ 分享链接用于前往 QQ 音乐，无法直接连接电脑客户端。</li><li><b>妥善保存：</b>修改会先保存在当前浏览器。启用原文件自动保存后，将直接写回选定的 HTML；请等页面显示「已写回原文件」再关闭。更换设备时携带这个 HTML，也可以导出备份；「导入备份」会恢复整个回忆册。</li></ol><p class="subtle-note">当前展示的现场均为示例，不代表你的真实经历。你可以单独删除示例照片。备份包含个人照片与音频，请自行保管。</p><div class="dialog-actions"><button class="button dark" data-close>开始收藏 ↗</button></div>`
};root.innerHTML=content[name]||'';if(!$('#settingsDialog').open)$('#settingsDialog').showModal();
if(name==='upload'){const choose=files=>{selectedFiles=[...files];$('#selectedLabel').textContent=selectedFiles.length?`已选择 ${selectedFiles.length} 张照片`:'点击选择，或把照片拖到这里'};$('#photoFiles').onchange=e=>choose(e.target.files);const drop=$('#dropzone');drop.ondragover=e=>{e.preventDefault();drop.classList.add('drag-over')};drop.ondragleave=()=>drop.classList.remove('drag-over');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('drag-over');choose(e.dataTransfer.files)};$('#savePhotos').onclick=async()=>{if(!selectedFiles.length)return toast('先选择几张现场照片吧');const button=$('#savePhotos');button.disabled=true;button.textContent='正在收藏…';try{const f=fields(),added=[];for(const [i,file] of selectedFiles.entries()){const src=await imageData(file);added.push({id:crypto.randomUUID(),src,...f,title:f.title?(selectedFiles.length>1?`${f.title} · ${i+1}`:f.title):file.name.replace(/\.[^.]+$/,''),album:f.album||'我的现场',favorite:false,demo:false})}photos.push(...added);current=photos.length-added.length;filter='mine';$$('[data-filter]').forEach(b=>b.classList.toggle('selected',b.dataset.filter===filter));const saved=await persist();render();resetTimer();closePanel();if(saved)toast(`已收藏 ${added.length} 张照片，回忆正在放映`)}catch(e){toast(e.message)}finally{button.disabled=false;button.textContent='保存到我的现场 ↗'}}}
if(name==='edit')$('#saveEdit').onclick=async()=>{const edited=fields();Object.assign(p,edited);if(typeof p.description==='string')p.description=edited.note;p.title=p.title||'未命名的回忆';const saved=await persist();render();closePanel();openLightbox(p.id);if(saved)toast('回忆已保存')};
if(name==='delete')$('#confirmDelete').onclick=async()=>{photos=photos.filter(x=>x.id!==p.id);current=Math.min(current,Math.max(photos.length-1,0));const saved=await persist();render();resetTimer();closePanel();if(saved)toast('照片已删除')};
if(name==='appearance'){const mark=()=>$$('[data-theme]').forEach(b=>b.classList.toggle('checked',b.dataset.theme===settings.theme));$$('[data-theme]').forEach(b=>b.onclick=()=>{settings.theme=b.dataset.theme;settings.color=themes[settings.theme];$('#backgroundColor').value=settings.color;applyAppearance();mark()});$('#backgroundColor').oninput=e=>{settings.color=e.target.value;settings.theme='custom';mark();applyAppearance()};$('#backgroundDim').oninput=e=>{settings.dim=Number(e.target.value);applyAppearance()};$('#backgroundFile').onchange=async e=>{if(!e.target.files.length)return;try{settings.background=await imageData(e.target.files[0]);applyAppearance();toast('背景预览已更新，点击保存布置保留')}catch(e){toast(e.message)}};$('#clearBackground').onclick=()=>{settings.background=null;applyAppearance()};$('#saveAppearance').onclick=async()=>{if(await persist()){closePanel();toast('你的空间，布置好了')}}}
if(name==='music'){setupMusicPanel()}}
function applyAppearance(){document.documentElement.style.setProperty('--paper',settings.color);document.documentElement.style.setProperty('--dim',settings.dim);$('#wallpaper').style.backgroundImage=settings.background?`url("${settings.background}")`:'none'}
document.addEventListener('click',e=>{const b=e.target.closest('[data-panel]');if(b)openPanel(b.dataset.panel);if(e.target.closest('[data-close]'))closePanel()});
$('#settingsDialog').addEventListener('close',()=>{if(activePanel==='appearance')persist();activePanel=null});
function setupMusicPanel(){
  const tab=name=>{$('#localMusic').hidden=name!=='local';$('#qqMusic').hidden=name!=='qq';$$('[data-music-tab]').forEach(b=>b.classList.toggle('selected',b.dataset.musicTab===name))};
  $$('[data-music-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.musicTab));
  $('#audioFile').onchange=async e=>{
    const input=e.target,files=[...input.files];input.value='';if(!files.length)return;
    input.disabled=true;$('#musicFileLabel').textContent='正在添加 '+files.length+' 首歌曲…';
    try{
      const result=await addMusicFiles(files);
      const message=result.added?(result.saved?'已保存 ':'已添加到本次页面，请另存 HTML 保留 ')+result.added+' 首歌曲':'没有添加歌曲';
      if(result.failed.length){const label=$('#musicFileLabel');if(label)label.textContent=message+'；未添加：'+result.failed.join('、');toast(message+'；'+result.failed.length+' 首未添加，请查看歌单提示')}
      else toast(message);
    }finally{input.disabled=false;if(!$('#musicFileLabel')?.textContent.includes('未添加：'))renderPlaylist()}
  };
  $('#panelVolume').oninput=e=>setVolume(Number(e.target.value));$('#panelVolume').onchange=()=>persist();
  $('#playMode').onchange=e=>setPlayMode(e.target.value);
  $('#panelPrevious').onclick=()=>stepTrack(-1);$('#panelNext').onclick=()=>stepTrack(1);$('#panelPlay').onclick=toggleMusic;
  renderPlaylist();
  const qq=()=>{const raw=$('#qqLink').value.trim();if(!raw)return null;try{const url=new URL(raw);if(url.protocol!=='https:'||!['y.qq.com','i.y.qq.com','c.y.qq.com','c6.y.qq.com','qm.qq.com'].includes(url.hostname))throw Error();return url.href}catch{toast('请填写 https://y.qq.com/ 等官方 QQ 音乐链接');return false}};$('#saveQQ').onclick=async()=>{const url=qq();if(url===false)return;settings.qq=url||'';if(await persist())toast(url?'QQ 音乐链接已保存':'QQ 音乐链接已清空')};$('#openQQ').onclick=()=>{const url=qq();if(url===false)return;window.open(url||'https://y.qq.com/','_blank','noopener,noreferrer')}}
function setVolume(v){settings.volume=v;audio.volume=v;$('#musicVolume').value=v}
$('#musicSettings').onclick=()=>openPanel('music');$('#musicPlay').onclick=toggleMusic;$('#musicVolume').oninput=e=>setVolume(Number(e.target.value));$('#musicVolume').onchange=()=>persist();
function playbackState(){const playing=!audio.paused;$('.music-player').classList.toggle('playing',playing);$('#musicPlay').textContent=playing?'Ⅱ':'▶';$('#musicPlay').setAttribute('aria-label',playing?'暂停背景音乐':'播放背景音乐');if($('#panelPlay'))$('#panelPlay').textContent=playing?'暂停音乐 Ⅱ':'播放音乐 ▶'}
audio.onplay=playbackState;audio.onpause=playbackState;audio.onemptied=playbackState;audio.ontimeupdate=()=>{$('#musicTime').textContent=`${Math.floor(audio.currentTime/60)}:${String(Math.floor(audio.currentTime%60)).padStart(2,'0')}`};audio.onerror=()=>{if(music)audioFailure(audio.error)};
setupMobileAudio();
setupPlaylistControls();
setupCompactPlayer();
setupInlinePhotoEditing();
setupPhotoZoom();
$('#backup').onclick=async()=>{
  const button=$('#backup');button.disabled=true;
  try{finishInlineEdit(true);const state=await selfContainedValue(JSON.parse(JSON.stringify(archiveState())));const data=JSON.stringify(state);const blob=new Blob([data],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`Encore-回忆备份-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('备份已导出，包含你的照片、文字、背景与音乐')}catch(error){toast(error.message||'备份导出失败，请重试')}finally{button.disabled=false}
};
$('#restore').onclick=()=>$('#restoreFile').click();
function validImage(src){return typeof src==='string'&&((Object.hasOwn(websiteMediaTypes,src)&&websiteMediaTypes[src].startsWith('image/'))||/^data:image\/(jpeg|png|webp|avif);base64,[A-Za-z0-9+/=]+$/.test(src)||/^https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+\?/.test(src))}
function validateBackup(data){if(data.format!=='encore-memories'||![1,2].includes(data.version)||!Array.isArray(data.photos)||data.photos.length>2000)throw Error('这不是有效的 Encore 备份');const ids=new Set();data.photos.forEach(p=>{if(!p||typeof p.id!=='string'||ids.has(p.id)||!validImage(p.src)||typeof p.title!=='string')throw Error('备份中的照片数据无效');ids.add(p.id);for(const k of ['album','date','location','note','caption','description'])if(p[k]!=null&&typeof p[k]!=='string')throw Error('备份中的文字数据无效')});const s=data.settings;if(!s||!/^#[a-f\d]{6}$/i.test(s.color)||!Number.isFinite(s.dim)||s.dim<0||s.dim>.75||!Number.isFinite(s.volume)||s.volume<0||s.volume>1||(s.background&&!validImage(s.background)))throw Error('备份中的背景设置无效');validateMusicArchive(data);if(data._editedAt!=null&&(!Number.isFinite(data._editedAt)||data._editedAt<0))throw Error('备份中的保存时间无效');return data}
$('#restoreFile').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{const data=validateBackup(JSON.parse(await file.text()));activePanel='restore';$('#panelContent').innerHTML=`<h2>恢复这本回忆册？</h2><p>备份包含 ${data.photos.length} 张照片、${(data.playlist||(data.music?[data.music]:[])).length} 首歌曲。导入后会替换此浏览器当前的照片、音乐和背景，请先导出当前内容。</p><div class="dialog-actions"><button class="button outline" data-close>取消</button><button class="button dark" id="confirmRestore">恢复备份</button></div>`;$('#settingsDialog').showModal();$('#confirmRestore').onclick=async()=>{audio.pause();restoreArchiveTimestamp(data);photos=data.photos;settings=data.settings;loadMusicState(data);current=0;filter='all';$$('[data-filter]').forEach(b=>b.classList.toggle('selected',b.dataset.filter==='all'));if(music)setAudioSource(music.src);else clearAudioSource();applyAppearance();setVolume(settings.volume);updateTrack();render();resetTimer();const saved=await persist();closePanel();if(saved)toast('回忆已恢复，欢迎回来')}}catch(e){toast(e.message||'备份文件无法读取')}};
async function init(){try{db=await openDB();const state=chooseArchiveState(await readDB(),readEmbeddedArchive());if(state){restoreArchiveTimestamp(state);photos=state.photos;settings={...settings,...state.settings};loadMusicState(state)}}catch(e){const embedded=readEmbeddedArchive();if(embedded){restoreArchiveTimestamp(embedded);photos=embedded.photos;settings={...settings,...embedded.settings};loadMusicState(embedded)}storageOK=false;$('.view-note').textContent='临时浏览 · 请导出备份';toast('浏览器存储不可用，关闭前请导出备份')}applyAppearance();setVolume(settings.volume);if(music)setAudioSource(music.src);updateTrack();render();resetTimer();restoreOriginalFileSaving()}
init();

function readEmbeddedArchive(){
  const element=document.getElementById('encore-embedded-state');
  try{const initial=element?JSON.parse(element.textContent):globalThis.ENCORE_INITIAL_ARCHIVE;return initial?validateBackup(initial):null}catch{toast('文件内的回忆数据无法读取，可以尝试导入备份');return null}
}
function encodeArchiveForHTML(state){return JSON.stringify(state).replace(/</g,'\\u003c')}


// The split website uses ordinary relative files. Downloads embed those files again.
function isSplitWebsite(){return !!document.querySelector('script[data-encore-source="app"]')}
async function readWebsiteResource(relative,asText=false){
  try{
    const response=await fetch(new URL(relative,document.baseURI));
    if(!response.ok)throw Error('HTTP '+response.status);
    return asText?await response.text():await response.blob();
  }catch(error){
    throw Error(location.protocol==='file:'?'请先通过本地网页服务或部署后的网址打开，再导出完整副本；直接打开文件时浏览器会限制读取配套文件。':'读取配套文件失败：'+relative+'。请确认完整上传了 website 文件夹。');
  }
}
function websiteBlobData(blob,type){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('媒体文件读取失败'));reader.readAsDataURL(new Blob([blob],{type}))})}
async function selfContainedValue(value,cache=new Map()){
  if(typeof value==='string'&&Object.hasOwn(websiteMediaTypes,value)){
    if(!cache.has(value))cache.set(value,readWebsiteResource(value).then(blob=>websiteBlobData(blob,websiteMediaTypes[value])));
    return cache.get(value);
  }
  if(Array.isArray(value)){const result=[];for(const item of value)result.push(await selfContainedValue(item,cache));return result}
  if(value&&typeof value==='object'){const result={};for(const [key,item] of Object.entries(value))result[key]=await selfContainedValue(item,cache);return result}
  return value;
}
async function inlineWebsiteSources(root){
  const externalApp=document.querySelector('script[data-encore-source="app"]');
  if(!externalApp)return;
  const css=await readWebsiteResource('style.css',true);
  let code=await readWebsiteResource('app.js',true);
  const demos=await selfContainedValue(bundledDemoImages);
  const start=code.indexOf('const bundledDemoImages=');
  const end=code.indexOf('\nconst websiteMediaTypes=',start);
  if(start<0||end<0)throw Error('配套脚本内容不完整，无法生成副本');
  code=code.slice(0,start)+'const bundledDemoImages='+JSON.stringify(demos)+';'+code.slice(end);
  root.querySelectorAll('[data-encore-source]').forEach(element=>element.remove());
  const style=document.createElement('style');style.textContent=css;root.querySelector('head').append(style);
  const script=document.createElement('script');script.textContent=code.replace(/<\/script/gi,'<\\/script');root.querySelector('body').append(script);
}

async function createPortableDocument({keepInstance=false}={}){
  const state=await selfContainedValue(JSON.parse(JSON.stringify(archiveState())));
    const root=document.documentElement.cloneNode(true);
    if(!keepInstance)root.dataset.encoreInstance=crypto.randomUUID();
    root.querySelector('#encore-embedded-state')?.remove();
    for(const selector of ['#carouselStage','#photoGrid','#panelContent','#toast'])root.querySelector(selector)?.replaceChildren();
    root.querySelector('#toast')?.classList.remove('show');
    root.querySelector('.view-note').textContent='保存在此浏览器';
    root.querySelector('#wallpaper')?.removeAttribute('style');
    root.querySelector('#audio')?.removeAttribute('src');
    root.querySelector('#playlistRows')?.replaceChildren();
    if(root.querySelector('#playbackStatus'))root.querySelector('#playbackStatus').textContent='打开后点击播放音乐';
    root.querySelector('#lightboxImage')?.removeAttribute('src');
    root.querySelector('#lightboxImage')?.removeAttribute('style');
    root.querySelector('#photoViewport')?.classList.remove('is-zoomed','is-panning');
    if(root.querySelector('#photoZoomLevel'))root.querySelector('#photoZoomLevel').textContent='100%';
    root.querySelector('#lightboxTitle')?.replaceChildren();
    root.querySelector('#lightboxMeta')?.replaceChildren();
    root.querySelector('#lightboxNote')?.replaceChildren();
    root.querySelectorAll('dialog').forEach(dialog=>dialog.removeAttribute('open'));
    root.querySelector('.music-player')?.classList.remove('playing','is-expanded');
    const more=root.querySelector('.music-more');
    more?.setAttribute('aria-expanded','false');more?.setAttribute('aria-label','展开音乐控制');
    root.querySelector('#musicSeek')?.setAttribute('value','0');
    if(root.querySelector('#compactMusicTime'))root.querySelector('#compactMusicTime').textContent='0:00 / --:--';
    const play=root.querySelector('#musicPlay');play.textContent='▶';play.setAttribute('aria-label','播放背景音乐');
    root.querySelector('#savePortable').disabled=false;
    root.querySelector('#savePortable').textContent='下载副本 ↗';
    const bind=root.querySelector('#bindLocalFile');if(bind){bind.hidden=false;bind.disabled=false;bind.textContent='启用原文件自动保存'}
    const save=root.querySelector('#saveOriginal');if(save){save.hidden=true;save.disabled=false}
    const status=root.querySelector('#localSaveStatus');if(status){status.textContent='打开后检查原文件保存权限';status.dataset.state='idle'}
    const embedded=document.createElement('script');
    embedded.id='encore-embedded-state';embedded.type='application/json';
    embedded.textContent=encodeArchiveForHTML(state);
    root.querySelector('head').append(embedded);
    await inlineWebsiteSources(root);
    const blob=new Blob(['<!doctype html>\n'+root.outerHTML],{type:'text/html;charset=utf-8'});
  return {blob};
}

const localFileSaving={handle:null,expected:null,revision:0,savedRevision:0,timer:null,running:null,binding:false,epoch:0,paused:false,reason:'',message:'',savedAt:null,remembered:true};
function supportsOriginalFileSaving(){return !isSplitWebsite()&&typeof window.showOpenFilePicker==='function'&&window.isSecureContext!==false}
function originalFileStamp(file){return {lastModified:file.lastModified,size:file.size}}
function sameOriginalFileStamp(a,b){return !!a&&!!b&&a.lastModified===b.lastModified&&a.size===b.size}
function originalSaveUI(){
  const status=document.getElementById('localSaveStatus'),bind=document.getElementById('bindLocalFile'),save=document.getElementById('saveOriginal');if(!status)return;
  const state=localFileSaving,cache=db&&storageOK?'当前浏览器':'本次页面';
  bind.disabled=state.binding||!supportsOriginalFileSaving();save.hidden=!state.handle;save.disabled=state.binding;
  bind.textContent=state.binding?'正在绑定文件…':state.handle?'重新选择保存文件':'启用原文件自动保存';
  status.dataset.state='idle';
  if(isSplitWebsite()){bind.hidden=true;save.hidden=true;status.textContent='修改自动保存在当前浏览器；下载副本或导出备份可以保留完整回忆。';return}
  if(!supportsOriginalFileSaving()){status.textContent='当前浏览器不支持覆盖本地文件，修改仅保存在'+cache+'。可换用支持该功能的浏览器，或下载副本。';return}
  if(state.binding){status.textContent='请选择当前这本回忆册的 HTML，并允许写入；将用当前页面内容更新它。';return}
  if(!state.handle&&state.bindError){status.dataset.state='error';status.textContent=state.message;return}
  if(!state.handle){status.textContent='尚未绑定原文件，修改仅保存在'+cache+'。启用后将直接写回所选 HTML，不再生成新版本。';return}
  if(state.paused){status.dataset.state='error';status.textContent=state.message;return}
  if(activeInlineEdit&&activeInlineEdit.input.value.trim()!==activeInlineEdit.original){status.dataset.state='pending';status.textContent='正在编辑文字，点击「完成」或空白处后将自动写回原文件。';return}
  if(state.running){status.dataset.state='saving';status.textContent='正在写回原文件：'+state.handle.name+'，请等待保存完成…';return}
  if(state.revision>state.savedRevision){status.dataset.state='pending';status.textContent='有修改待写回原文件：'+state.handle.name;return}
  status.dataset.state='saved';
  status.textContent='已写回原文件：'+state.handle.name+(state.savedAt?' · '+state.savedAt.toLocaleTimeString():'')+(state.remembered?'':'（重开后需重新选择文件）');
}
function markArchiveChanged(){
  archiveEditedAt=Math.max(Date.now(),archiveEditedAt+1);
  localFileSaving.revision++;
  if(localFileSaving.handle&&!localFileSaving.paused&&!localFileSaving.binding)scheduleOriginalFileWrite();
  originalSaveUI();
}
function chooseArchiveState(cached,embedded){
  if(!cached)return embedded;if(!embedded)return cached;
  return (embedded._editedAt||0)>(cached._editedAt||0)?embedded:cached;
}
function restoreArchiveTimestamp(state){archiveEditedAt=Number.isFinite(state?._editedAt)?state._editedAt:0}
function scheduleOriginalFileWrite(){
  clearTimeout(localFileSaving.timer);
  if(!localFileSaving.handle||localFileSaving.paused||localFileSaving.binding)return;
  localFileSaving.timer=setTimeout(()=>{localFileSaving.timer=null;flushOriginalFile()},900);
}
function originalFileRecord(mode,value){
  if(!db||!storageOK)return Promise.resolve(mode==='get'?null:false);
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('archive',mode==='get'?'readonly':'readwrite'),store=tx.objectStore('archive');
    if(mode==='get'){const req=store.get('original-html-file');req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)}
    else{store.put(value,'original-html-file');tx.oncomplete=()=>resolve(true)}
    tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
}
async function rememberOriginalFile(){
  try{return await originalFileRecord('put',{handle:localFileSaving.handle,expected:localFileSaving.expected})}catch{return false}
}
async function originalFilePermission(handle,ask=false){
  if(await handle.queryPermission({mode:'readwrite'})==='granted')return true;
  return ask&&await handle.requestPermission({mode:'readwrite'})==='granted';
}
function originalFileError(message,code){const error=new Error(message);error.code=code;return error}
function pauseOriginalFileSaving(error){
  const state=localFileSaving;state.lastError={stage:state.stage||'准备保存',name:error.name||'Error',message:error.message||'',code:error.code||''};state.paused=true;clearTimeout(state.timer);state.timer=null;
  if(error.code==='FILE_CHANGED'){state.reason='conflict';state.message='原文件已被其他窗口或程序修改，自动保存已暂停。请重新选择保存文件后再写回，当前页面的修改仍保留。'}
  else if(error.name==='NotAllowedError'||error.name==='SecurityError'){state.reason='permission';state.message='原文件尚未写回：需要重新授权。点击「立即写回」允许保存；当前页面的修改仍保留。'}
  else if(error.name==='NotFoundError'){state.reason='missing';state.message='原文件已移动或不存在，尚未写回。请重新选择保存文件。'}
  else if(error.code==='WRITE_UNSUPPORTED'||error.name==='NotSupportedError'){state.reason='unsupported';state.message='这个浏览器或所选文件提供方不支持写回原文件。请先下载副本保留修改，再从手机固定文件夹打开并尝试支持写入的浏览器。'}
  else if(error.name==='NoModificationAllowedError'){state.reason='locked';state.message='文件当前无法写入，可能被占用或所在位置只允许读取。请关闭其他打开它的页面，或把文件移到「下载／文档」后重新绑定。'}
  else{state.reason='io';state.message=state.stage==='整理回忆内容'?'整理回忆内容时出错，尚未写回原文件。请先下载副本或导出备份。':'原文件写回失败，未确认保存成功。请先下载副本保留修改，再根据下面的具体错误重试。'}
  state.message+='（阶段：'+state.lastError.stage+'；'+state.lastError.name+(state.lastError.message?'：'+state.lastError.message.slice(0,180):'')+'）';
  originalSaveUI();toast(state.message);
}
function flushOriginalFile(){
  const state=localFileSaving;clearTimeout(state.timer);state.timer=null;
  if(state.running)return state.running;
  if(!state.handle||state.paused||state.binding)return Promise.resolve(false);
  const work=async()=>{
    while(state.revision>state.savedRevision&&!state.paused&&!state.binding){
      const handle=state.handle,revision=state.revision;state.stage='检查写入权限';
      if(!await originalFilePermission(handle)){const error=new Error('Permission required');error.name='NotAllowedError';throw error}
      state.stage='读取原文件信息';const before=await handle.getFile();
      if(!sameOriginalFileStamp(originalFileStamp(before),state.expected))throw originalFileError('File changed','FILE_CHANGED');
      state.stage='整理回忆内容';const {blob}=await createPortableDocument({keepInstance:true});
      let stream;
      try{
        state.stage='开启文件写入';
        if(typeof handle.createWritable!=='function')throw originalFileError('当前文件只支持读取，没有可用的写入接口','WRITE_UNSUPPORTED');
        stream=await handle.createWritable();
        if(typeof stream?.write!=='function'||typeof stream?.close!=='function')throw originalFileError('当前浏览器未提供完整的文件写入能力','WRITE_UNSUPPORTED');
        state.stage='写入回忆内容';await stream.write(blob);
        // Writes are staged by the browser. Check for external changes before committing.
        state.stage='写入前校验文件状态';const current=await handle.getFile();
        if(!sameOriginalFileStamp(originalFileStamp(current),state.expected))throw originalFileError('File changed during save','FILE_CHANGED');
        state.stage='确认覆盖原文件';await stream.close();
      }catch(error){if(stream)try{await stream.abort()}catch{}throw error}
      state.stage='确认保存结果';state.expected=originalFileStamp(await handle.getFile());state.savedRevision=revision;state.savedAt=new Date();
      state.remembered=await rememberOriginalFile();
    }
    return state.revision<=state.savedRevision;
  };
  state.running=work().catch(error=>{pauseOriginalFileSaving(error);return false}).finally(()=>{state.running=null;originalSaveUI()});
  originalSaveUI();return state.running;
}
function validateOriginalFileText(text){
  const instance=document.documentElement.dataset.encoreInstance;
  const selected=text.match(/<html\b[^>]*data-encore-instance=["']([^"']+)["']/i)?.[1];
  if(!instance||selected!==instance)throw originalFileError('请选择当前这本回忆册的 HTML，不能绑定其他回忆册或无关文件。','WRONG_MEMOIR');
  const embedded=text.match(/<script\b[^>]*id=["']encore-embedded-state["'][^>]*>([\s\S]*?)<\/script>/i);
  if(embedded)validateBackup(JSON.parse(embedded[1]));
  else if(!text.includes('id="photoGrid"')||!text.includes('id="savePortable"')||!text.includes('<style>'))throw originalFileError('这不是完整的回忆册 HTML 文件。','WRONG_MEMOIR');
}
async function bindOriginalFile(){
  if(!supportsOriginalFileSaving()){originalSaveUI();return false}
  const state=localFileSaving;if(state.binding)return false;
  state.binding=true;state.epoch++;clearTimeout(state.timer);originalSaveUI();
  let chosen=false;
  try{
    const [handle]=await window.showOpenFilePicker({multiple:false,types:[{description:'当前回忆册 HTML',accept:{'text/html':['.html','.htm']}}]});
    if(!handle)return false;
    if(typeof handle.createWritable!=='function')throw originalFileError('此浏览器可以选择文件，但不能写回原文件。请先下载副本保留修改，再换用支持原文件写入的浏览器。','WRITE_UNSUPPORTED');
    if(!await originalFilePermission(handle,true)){toast('没有获得写入权限，尚未启用原文件自动保存');return false}
    if(state.running)await state.running;
    const file=await handle.getFile();validateOriginalFileText(await file.text());
    finishInlineEdit(true);
    state.handle=handle;state.bindError=false;state.expected=originalFileStamp(file);state.paused=false;state.reason='';state.message='';state.savedAt=null;
    state.revision++;state.savedRevision=state.revision-1;chosen=true;
  }catch(error){if(error.name!=='AbortError'){const message=['WRONG_MEMOIR','WRITE_UNSUPPORTED'].includes(error.code)?error.message:'无法绑定原文件：'+(error.name||'Error')+'：'+(error.message||'请选择可写的 HTML 文件');if(!state.handle){state.message=message;state.bindError=true}toast(message)}}
  finally{state.binding=false;originalSaveUI();if(state.handle&&!state.paused&&state.revision>state.savedRevision)scheduleOriginalFileWrite()}
  if(chosen){clearTimeout(state.timer);return flushOriginalFile()}
  return false;
}
async function saveOriginalNow(){
  finishInlineEdit(true);
  const state=localFileSaving;if(!state.handle)return bindOriginalFile();if(state.binding)return false;
  if(state.reason==='conflict'||state.reason==='missing'){toast('请先点击「重新选择保存文件」，选择要更新的原文件');return false}
  try{
    if(!await originalFilePermission(state.handle,true)){toast('未获得写入权限，原文件尚未更新');return false}
    state.paused=false;state.reason='';state.message='';
    if(state.revision<=state.savedRevision)state.revision++;
    return flushOriginalFile();
  }catch(error){pauseOriginalFileSaving(error);return false}
}
async function restoreOriginalFileSaving(){
  if(!supportsOriginalFileSaving()){originalSaveUI();return}
  const state=localFileSaving,epoch=state.epoch;
  try{
    const record=await originalFileRecord('get');
    if(epoch!==state.epoch||state.binding||state.handle||!record?.handle)return;
    state.handle=record.handle;state.expected=record.expected;state.revision++;
    if(await originalFilePermission(state.handle)){scheduleOriginalFileWrite()}
    else{state.paused=true;state.reason='permission';state.message='已记住原文件，但需要重新授权。点击「立即写回」后才能继续自动保存。'}
  }catch{state.paused=true;state.reason='missing';state.message='无法恢复原文件绑定，请重新选择保存文件。'}
  originalSaveUI();
}
function setupLocalFileSaving(){
  const footer=document.querySelector('.collection-footer');
  if(!document.getElementById('bindLocalFile')){
    const bind=document.createElement('button');bind.id='bindLocalFile';bind.className='text-button';footer.prepend(bind);
    const save=document.createElement('button');save.id='saveOriginal';save.className='text-button';save.textContent='立即写回';save.hidden=true;bind.after(save);
    const status=document.createElement('span');status.id='localSaveStatus';status.className='local-save-status';status.setAttribute('role','status');footer.append(status);
  }
  document.getElementById('bindLocalFile').onclick=bindOriginalFile;document.getElementById('saveOriginal').onclick=saveOriginalNow;
  document.getElementById('savePortable').textContent='下载副本 ↗';originalSaveUI();
  window.addEventListener('beforeunload',event=>{const editing=activeInlineEdit&&activeInlineEdit.input.value.trim()!==activeInlineEdit.original;if(localFileSaving.handle&&(editing||localFileSaving.running||localFileSaving.revision>localFileSaving.savedRevision)){event.preventDefault();event.returnValue=''}});
}
function inlineSaveNotice(){return localFileSaving.handle&&!localFileSaving.paused?'文字已保存，正在自动写回原文件':'文字已保存在浏览器；启用原文件自动保存可直接写回 HTML'}

document.getElementById('savePortable').onclick=async()=>{
  const button=document.getElementById('savePortable');button.disabled=true;button.textContent='正在整理回忆…';
  try{
    finishInlineEdit(true);const {blob}=await createPortableDocument();
    const href=URL.createObjectURL(blob),link=document.createElement('a');
    const now=new Date(),date=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
    link.href=href;link.download='Encore-我的回忆-'+date+'.html';link.click();
    setTimeout(()=>URL.revokeObjectURL(href),10000);toast('已下载回忆册副本，包含当前全部照片、文字、背景和歌曲');
  }catch(error){toast(error.message||'下载失败，请先尝试导出 JSON 备份')}
  finally{button.disabled=false;button.textContent='下载副本 ↗'}
};
setupLocalFileSaving();
