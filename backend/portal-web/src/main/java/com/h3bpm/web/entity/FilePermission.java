package com.h3bpm.web.entity;

import com.h3bpm.web.utils.ObjectUtil;

import java.io.IOException;

public class FilePermission {
	private String fileId = null;
	private byte[] orgs = null;
	private byte[] users = null;

	@Deprecated
	public FilePermission(){

	}

	public FilePermission(com.h3bpm.web.vo.FilePermissionVo voBean) {
		if(voBean == null){
			return;
		}
		this.fileId = voBean.getFileId();

		try {
			orgs = ObjectUtil.persistenceObject(voBean.getOrgList());
			users = ObjectUtil.persistenceObject(voBean.getUserList());

		} catch (NullPointerException | IOException e) {
			e.printStackTrace();
		}

		System.out.println("方法执行完毕");

	}

	public String getFileId() {
		return fileId;
	}

	public void setFileId(String fileId) {
		this.fileId = fileId;
	}

	public byte[] getOrgs() {
		return orgs;
	}

	public void setOrgs(byte[] orgs) {
		this.orgs = orgs;
	}

	public byte[] getUsers() {
		return users;
	}

	public void setUsers(byte[] users) {
		this.users = users;
	}
}
