'use client';

import React from 'react';
import { X, BookOpen, Upload, Settings, Play, Download, FileText, Image, Zap, Shield, Globe } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 对话框 */}
      <div className="relative bg-white rounded-2xl shadow-strong max-w-4xl w-full mx-4 max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-blue-100">
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">使用说明</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-8">
            {/* 功能介绍 */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <span>功能简介</span>
              </h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">
                  这是一个批量文生图工具，支持通过CSV文件批量生成图片。您可以一次性上传包含多个提示词的CSV文件，
                  系统会自动批量生成对应的图片，大大提升工作效率。
                </p>
              </div>
            </section>

            {/* 联系方式 - 显眼位置 */}
            <section>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 shadow-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-2 rounded-full bg-green-100 mr-3">
                      <Globe className="w-5 h-5 text-green-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">技术支持</h4>
                  </div>
                  <div className="bg-white border border-green-200 rounded-lg p-4 mb-3">
                    <h5 className="font-semibold text-gray-900 mb-2">遇到问题？我来帮您！</h5>
                    <p className="text-sm text-gray-600 mb-3">
                      使用过程中有任何问题都可以联系我，我会及时为您解答
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800">微信联系方式</p>
                      <p className="text-xl font-bold text-green-600 mt-1">rzcxbs_77</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    💬 欢迎随时咨询，我会尽快回复您的问题
                  </p>
                </div>
              </div>
            </section>

            {/* 使用步骤 */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Play className="w-5 h-5 text-green-500" />
                <span>使用步骤</span>
              </h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">配置API密钥</h5>
                    <p className="text-sm text-gray-600">点击右上角"设置"按钮，输入您的API密钥。申请地址：<a href="https://ismaque.org" target="_blank" className="text-blue-500 hover:text-blue-600">https://ismaque.org</a></p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">准备CSV文件</h5>
                    <p className="text-sm text-gray-600">创建包含提示词的CSV文件，第一列是编号，第二列是提示词，第一行是表头</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">上传CSV文件</h5>
                    <p className="text-sm text-gray-600">点击"选择CSV文件"按钮，上传您的CSV文件。系统会自动解析并显示任务列表</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">上传参考图（可选）</h5>
                    <p className="text-sm text-gray-600">如需使用参考图，请确保图片文件名与提示词中的角色名称一致，如"角色A.jpg"</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">5</div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">选择任务并开始生成</h5>
                    <p className="text-sm text-gray-600">在任务列表中选择要生成的任务，点击"开始生成"按钮开始批量生成</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">6</div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">导出结果</h5>
                    <p className="text-sm text-gray-600">生成完成后，点击"导出结果"按钮下载CSV文件和所有生成的图片</p>
                  </div>
                </div>
              </div>
            </section>

            {/* CSV格式说明 */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-500" />
                <span>CSV文件格式</span>
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">CSV文件格式要求：</p>
                  <div className="bg-white border border-gray-200 rounded p-3">
                    <div className="text-xs font-mono text-gray-800">
                      <div className="font-semibold text-gray-900 mb-2">示例CSV格式：</div>
                      <div>分镜数,分镜提示词</div>
                      <div>1,"一只可爱的小猫坐在花园里"</div>
                      <div>2,"现代城市夜景，霓虹灯闪烁"</div>
                      <div>3,"雪山日出，金色阳光洒在雪峰上"</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• <strong>第一列</strong>：编号（如：1, 2, 3...）</p>
                    <p>• <strong>第二列</strong>：提示词（包含图片生成的描述）</p>
                    <p>• <strong>第一行</strong>：表头（列名）</p>
                    <p>• 其他列会被保留，但不会影响生成过程</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 参考图功能说明 */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Image className="w-5 h-5 text-pink-500" />
                <span>参考图功能</span>
              </h4>
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-4">
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    本工具支持为不同角色上传参考图片，提升生成质量和角色一致性。
                  </p>
                  <div className="bg-white border border-pink-200 rounded p-3">
                    <h6 className="font-medium text-gray-900 mb-2">参考图使用说明：</h6>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>• 上传的图片文件名需要与提示词中的角色名称保持一致</p>
                      <p>• 例如：提示词中有"角色A"，参考图文件名应为"角色A.jpg"</p>
                      <p>• 系统会自动匹配角色名和参考图，提升生成质量</p>
                      <p>• 支持为每个角色上传参考图</p>
                    </div>
                  </div>
                  <div className="text-xs text-pink-600 bg-pink-50 border border-pink-200 rounded p-2">
                    💡 提示：参考图功能特别适合需要保持角色一致性的连续创作场景
                  </div>
                </div>
              </div>
            </section>

            {/* 功能特性 */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-orange-500" />
                <span>功能特性</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-blue-500" />
                    <span>批量处理</span>
                  </h5>
                  <p className="text-sm text-gray-600">支持一次性处理数百个任务，大幅提升工作效率</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-green-500" />
                    <span>灵活配置</span>
                  </h5>
                  <p className="text-sm text-gray-600">支持多种生成风格、图片比例和并发设置</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                    <Download className="w-4 h-4 text-purple-500" />
                    <span>一键导出</span>
                  </h5>
                  <p className="text-sm text-gray-600">生成完成后可一键导出所有图片和结果文件</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-orange-500" />
                    <span>安全可靠</span>
                  </h5>
                  <p className="text-sm text-gray-600">API密钥本地存储，数据安全有保障</p>
                </div>
              </div>
            </section>


            {/* 注意事项 */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-red-500" />
                <span>注意事项</span>
              </h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="space-y-2 text-sm text-gray-700">
                  <p>• 请确保网络连接稳定，避免生成过程中断</p>
                  <p>• 建议根据您的API配额合理设置并发数量</p>
                  <p>• 生成过程中可以随时点击"停止生成"按钮中断</p>
                  <p>• 失败的任务可以重新选择后再次生成</p>
                  <p>• 生成的图片会保存在浏览器本地，请及时导出备份</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end space-x-3 p-4 sm:p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 rounded-lg shadow-sm hover:shadow-md text-sm sm:text-base"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
