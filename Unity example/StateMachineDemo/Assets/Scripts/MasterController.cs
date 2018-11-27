using System.Collections;
using System.Collections.Generic;
using UnityEngine;

using System.Runtime.InteropServices;

public class MasterController : MonoBehaviour
{
	public enum CartMachineState
	{
		CartMachineStart = 0,
		CartMachineLeft,
		CartMachineRight,
		CartMachineEnd
	}

	public enum SwitchMachineState
	{
		SwitchMachineLeft = 0,
		SwitchMachineRight
	}

	[DllImport("statemachines")]
	private static extern int CartMachineInitialState();

	[DllImport("statemachines")]
	private static extern int CartMachineFromStartToLeft(int currentCartMachineState, int currentSwitchMachineState);

	[DllImport("statemachines")]
	private static extern int CartMachineFromStartToRight(int currentCartMachineState, int currentSwitchMachineState);

	[DllImport("statemachines")]
	private static extern int CartMachineFromLeftToStart(int currentCartMachineState, int currentSwitchMachineState);

	[DllImport("statemachines")]
	private static extern int CartMachineFromLeftToEnd(int currentCartMachineState);

	[DllImport("statemachines")]
	private static extern int CartMachineFromRightToStart(int currentCartMachineState, int currentSwitchMachineState);

	[DllImport("statemachines")]
	private static extern int CartMachineFromRightToEnd(int currentCartMachineState);

	[DllImport("statemachines")]
	private static extern int CartMachineFromEndToLeft(int currentCartMachineState);

	[DllImport("statemachines")]
	private static extern int CartMachineFromEndToRight(int currentCartMachineState);

	[DllImport("statemachines")]
	private static extern int SwitchMachineInitialState();

	[DllImport("statemachines")]
	private static extern int SwitchMachineFromLeftToRight(int currentSwitchMachineState);

	[DllImport("statemachines")]
	private static extern int SwitchMachineFromRightToLeft(int currentSwitchMachineState);

	public GameObject cartObject;
	public GameObject switchObject;
	public GameObject leftPath;
	public GameObject rightPath;
	public GameObject pointStart;
	public GameObject pointLeft;
	public GameObject pointRight;
	public GameObject pointEnd;
	
	private CartController cartController;
	private SwitchController switchController;

	public CartMachineState cartState = (CartMachineState)CartMachineInitialState();
	public SwitchMachineState switchState = (SwitchMachineState)SwitchMachineInitialState();

	void Start()
	{
		cartController = cartObject.GetComponent<CartController>();
		switchController = switchObject.GetComponent<SwitchController>();

		leftPath.SetActive(switchState == SwitchMachineState.SwitchMachineLeft);
        rightPath.SetActive(switchState == SwitchMachineState.SwitchMachineRight);
	}

	void Update()
	{
		if(Input.GetKeyDown(KeyCode.LeftArrow))
		{
			GoLeft();
		}
		else if(Input.GetKeyDown(KeyCode.RightArrow))
		{
			GoRight();
		}
		else if(Input.GetKeyDown(KeyCode.UpArrow))
		{
			GoEnd();
		}
		else if(Input.GetKeyDown(KeyCode.DownArrow))
		{
			GoStart();
		}
		else if(Input.GetKeyDown(KeyCode.S))
		{
			FlipSwitch();
		}
	}

	void FlipSwitch()
	{
		Debug.Log("Attempting to flip switch");

        if(switchController.IsLocked())
        {
            Debug.Log("Switch is locked!");
            return;
        }

		if(switchState == SwitchMachineState.SwitchMachineLeft)
		{
			switchState = (SwitchMachineState)SwitchMachineFromLeftToRight((int)switchState);
			switchController.Poke(false);
		}
		else
		{
			switchState = (SwitchMachineState)SwitchMachineFromRightToLeft((int)switchState);
			switchController.Poke(true);
		}

		leftPath.SetActive(switchState == SwitchMachineState.SwitchMachineLeft);
		rightPath.SetActive(switchState == SwitchMachineState.SwitchMachineRight);
	}

	void GoStart()
	{
		Debug.Log("Attempting to go to start");

        if(cartController.IsLocked())
        {
            Debug.Log("Cart is locked!");
            return;
        }

		var oldState = cartState;

		cartState = (CartMachineState)CartMachineFromLeftToStart((int)cartState, (int)switchState);
		cartState = (CartMachineState)CartMachineFromRightToStart((int)cartState, (int)switchState);

		if(cartState == oldState)
		{
			Debug.Log("Can't move to start from here");
		}
		else
		{
			cartController.Poke(pointStart.transform.position);
		}
	}

	void GoLeft()
	{
		Debug.Log("Attempting to go to left");

        if (cartController.IsLocked())
        {
            Debug.Log("Cart is locked!");
            return;
        }

        var oldState = cartState;

		cartState = (CartMachineState)CartMachineFromStartToLeft((int)cartState, (int)switchState);
		cartState = (CartMachineState)CartMachineFromEndToLeft((int)cartState);

		if(cartState == oldState)
		{
			Debug.Log("Can't move to left from here");
		}
		else
		{
			cartController.Poke(pointLeft.transform.position);
		}		
	}

	void GoRight()
	{
		Debug.Log("Attempting to go to right");

        if (cartController.IsLocked())
        {
            Debug.Log("Cart is locked!");
            return;
        }

        var oldState = cartState;

		cartState = (CartMachineState)CartMachineFromStartToRight((int)cartState, (int)switchState);
		cartState = (CartMachineState)CartMachineFromEndToRight((int)cartState);

		if(cartState == oldState)
		{
			Debug.Log("Can't move to right from here");
		}
		else
		{
			cartController.Poke(pointRight.transform.position);
		}
	}

	void GoEnd()
	{
		Debug.Log("Attempting to go to end");

        if (cartController.IsLocked())
        {
            Debug.Log("Cart is locked!");
            return;
        }

        var oldState = cartState;

		cartState = (CartMachineState)CartMachineFromLeftToEnd((int)cartState);
		cartState = (CartMachineState)CartMachineFromRightToEnd((int)cartState);

		if(cartState == oldState)
		{
			Debug.Log("Can't move to end from here");
		}
		else
		{
			cartController.Poke(pointEnd.transform.position);
		}
	}
}
