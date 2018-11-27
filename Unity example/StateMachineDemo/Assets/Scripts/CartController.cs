using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class CartController : MonoBehaviour {
    private bool locked = false;

	public void Poke (Vector3 target) 
    {
        Lock();
        iTween.MoveTo(gameObject, iTween.Hash("position", target, "time", 1, "oncomplete", "Unlock", "easetype", iTween.EaseType.easeInOutQuad));
        transform.forward = (target - transform.position).normalized;
	}

    public void Lock()
    {
        locked = true;
    }

    public void Unlock()
    {
        locked = false;
    }

    public bool IsLocked()
    {
        return locked;
    }
}
